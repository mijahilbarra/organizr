import { Request, Response } from "express";
import { readDb } from "../../db/readDb";
import { writeDb } from "../../db/writeDb";
import { compileExtractorScript } from "../analyze/compileExtractorScript";
import { getGmailAccessTokenFromRequest } from "../auth/getGmailAccessTokenFromRequest";
import { fetchGmailMessageDetail } from "../emails/fetchGmailMessageDetail";
import { getGmailRequestHeaders } from "../emails/getGmailRequestHeaders";
import { sendToWebhook } from "./sendToWebhook";
import { ExtractionRecord } from "../../types";
import { getExtractorIndexById } from "./getExtractorIndexById";

/**
 * Triggers a saved extractor to scrape the Gmail inbox for new, unparsed emails matching its selection query.
 * Compiles and runs the extractor's RegExp routine, stores new extraction rows, and calls configured outbound webhooks.
 */
export async function triggerExtractor(req: Request, res: Response) {
  const { id } = req.params;
  const token = getGmailAccessTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: "Gmail Authorization Access Token is required to execute inbox scans." });
  }

  try {
    const dbObj = await readDb();
    const extractorIndex = getExtractorIndexById(dbObj, id);

    if (extractorIndex === -1) {
      return res.status(404).json({ error: `Extractor with ID '${id}' was not found.` });
    }

    const extractor = dbObj.extractors[extractorIndex];
    const existingEmailIds = new Set(extractor.extractions.map((e) => e.emailId));

    // 1. Scan Gmail inbox using extractor's original search keyword
    const query = `subject:"${extractor.query}"`;
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`;

    const searchResponse = await fetch(searchUrl, {
      headers: getGmailRequestHeaders(token),
    });

    if (!searchResponse.ok) {
      const text = await searchResponse.text();
      return res.status(200).json({ 
        error: `Gmail query failed (HTTP ${searchResponse.status}): ${text}. Please verify if the token has the necessary scopes and that the Gmail API is enabled in your Google Console.` 
      });
    }

    const searchData = await searchResponse.json();
    const messages = searchData.messages || [];

    // Filter to find messages we have NOT already parsed
    const unparsedMessages = messages.filter((msg: any) => !existingEmailIds.has(msg.id));

    if (unparsedMessages.length === 0) {
      // Direct success but nothing matches, increment count representing scanning check
      extractor.triggerCount += 1;
      await writeDb(dbObj);
      return res.json({ message: "Scan completed. No new matching records found.", extractor });
    }

    const extractFn = compileExtractorScript(extractor.scriptCode);

    const newRecords: ExtractionRecord[] = [];

    for (const msg of unparsedMessages) {
      try {
        const detailData = await fetchGmailMessageDetail(token, msg.id);
        if (!detailData) continue;

        // Run extraction logic
        const parsedData = extractFn(detailData.body, detailData.subject, detailData.from);

        const newRecord: ExtractionRecord = {
          id: `rec_${Math.random().toString(36).substring(2, 9)}`,
          emailId: detailData.id,
          subject: detailData.subject,
          from: detailData.from,
          date: detailData.date,
          extractedData: parsedData,
          timestamp: new Date().toISOString(),
        };

        newRecords.push(newRecord);

        // Call Outbound Webhook asynchronously for each completed extraction
        if (extractor.webhookUrl) {
          sendToWebhook(extractor.webhookUrl, {
            event: "extractor.record_discovered",
            extractorId: extractor.id,
            extractorName: extractor.name,
            record: newRecord,
          }).catch((err) => console.error("Webhook error during trigger execution:", err));
        }

      } catch (err) {
        console.error(`Dynamic parsing error during triggering on message ${msg.id}:`, err);
      }
    }

    if (newRecords.length > 0) {
      extractor.extractions = [...newRecords, ...extractor.extractions];
      extractor.triggerCount += 1;
      await writeDb(dbObj);
    }

    res.json({
      message: `Scanned and successfully extracted ${newRecords.length} new records!`,
      newCount: newRecords.length,
      extractor,
    });

  } catch (error: any) {
    console.error("Scheduled trigger handler failed:", error);
    res.status(200).json({ error: error.message || "Something went wrong during dynamic extraction run." });
  }
}
