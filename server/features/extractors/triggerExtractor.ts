import { Request, Response } from "express";
import { compileExtractorScript } from "../analyze/compileExtractorScript";
import { getPersistedGmailAccessToken } from "../auth/getPersistedGmailAccessToken";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { fetchGmailEmailsBySubject } from "../emails/fetchGmailEmailsBySubject";
import { sendToWebhook } from "./sendToWebhook";
import { ExtractionRecord } from "../../types";
import { getExtractorSubjects } from "./getExtractorSubjects";
import { loadExtractorContextById } from "./loadExtractorContextById";
import { saveExtractor } from "./saveExtractor";

/**
 * Triggers a saved extractor to scrape the Gmail inbox for new, unparsed emails matching its selection query.
 * Compiles and runs the extractor's RegExp routine, stores new extraction rows, and calls configured outbound webhooks.
 */
export async function triggerExtractor(req: Request, res: Response) {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  const token = await getPersistedGmailAccessToken(req);
  if (!token) {
    return res.status(401).json({ error: "Connect Gmail before executing inbox scans. Stored Gmail access expires weekly." });
  }

  try {
    const extractorContext = await loadExtractorContextById(id, firebaseUser.uid);

    if (!extractorContext) {
      return res.status(404).json({ error: `Extractor with ID '${id}' was not found.` });
    }

    const { extractor } = extractorContext;
    const existingEmailIds = new Set(extractor.extractions.map((e) => e.emailId));
    const extractorSubjects = getExtractorSubjects(extractor);
    extractor.subjects = extractorSubjects;

    if (extractorSubjects.length === 0) {
      return res.status(400).json({ error: "Extractor has no registered subjects to scan." });
    }

    const unparsedEmailsById = new Map<string, any>();
    const scannedAt = new Date().toISOString();

    // 1. Scan Gmail inbox using every registered subject for the shared extractor schema.
    for (const registeredSubject of extractorSubjects) {
      const emails = await fetchGmailEmailsBySubject(token, registeredSubject.value, 20);
      registeredSubject.lastScannedAt = scannedAt;

      emails.forEach((email) => {
        if (!existingEmailIds.has(email.id)) {
          unparsedEmailsById.set(email.id, email);
        }
      });
    }

    if (unparsedEmailsById.size === 0) {
      // Direct success but nothing matches, increment count representing scanning check
      extractor.triggerCount += 1;
      await saveExtractor(extractor);
      return res.json({ message: "Scan completed. No new matching records found.", extractor });
    }

    const extractFn = compileExtractorScript(extractor.scriptCode);

    const newRecords: ExtractionRecord[] = [];

    for (const detailData of unparsedEmailsById.values()) {
      try {
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
        existingEmailIds.add(detailData.id);

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
        console.error(`Dynamic parsing error during triggering on message ${detailData.id}:`, err);
      }
    }

    if (newRecords.length > 0) {
      extractor.extractions = [...newRecords, ...extractor.extractions];
      extractor.triggerCount += 1;
      await saveExtractor(extractor);
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
