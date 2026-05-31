import { Request, Response } from "express";
import { readDb } from "../../db/readDb";
import { writeDb } from "../../db/writeDb";
import { Extractor, ExtractionRecord } from "../../types";
import { sendToWebhook } from "./sendToWebhook";

/**
 * Creates and persists a new email extractor containing layout descriptions,
 * parsing routines, and initial matching message extractions.
 */
export async function createExtractor(req: Request, res: Response) {
  const {
    name,
    query,
    detectedType,
    explanation,
    scriptCode,
    aiScriptCode,
    schemaFields,
    webhookUrl,
    enabledSchedule,
    initialEmails,
    initialResults,
  } = req.body;

  if (!name || !query || !scriptCode || !schemaFields) {
    return res.status(400).json({ error: "Missing required extractor definition parameters (name, query, scriptCode, or schema)." });
  }

  try {
    const dbObj = await readDb();

    // Create unique ID
    const extractorId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Build initial extractions from results
    const extractions: ExtractionRecord[] = [];
    if (initialEmails && Array.isArray(initialEmails)) {
      initialEmails.forEach((mail: any) => {
        // Find matching parsed result
        const matchRes = initialResults?.find((r: any) => r.emailId === mail.id);
        if (matchRes) {
          try {
            const parsedData = JSON.parse(matchRes.extractedData);
            extractions.push({
              id: `rec_${Math.random().toString(36).substring(2, 9)}`,
              emailId: mail.id,
              subject: mail.subject || "No Subject",
              date: mail.date || "Unknown Date",
              from: mail.from || "Unknown Sender",
              extractedData: parsedData,
              timestamp: new Date().toISOString(),
            });
          } catch (e) {
            console.warn(`Initial result parsing crashed for mail ${mail.id}:`, e);
          }
        }
      });
    }

    const newExtractor: Extractor = {
      id: extractorId,
      name,
      query,
      detectedType: detectedType || "Custom",
      explanation: explanation || "",
      scriptCode,
      aiScriptCode: aiScriptCode || "",
      schemaFields,
      webhookUrl: webhookUrl || "",
      enabledSchedule: !!enabledSchedule,
      triggerCount: extractions.length > 0 ? 1 : 0,
      extractions,
      createdAt: new Date().toISOString(),
    };

    dbObj.extractors.push(newExtractor);
    await writeDb(dbObj);

    // If webhook configured, push initial records to webhook asynchronously
    if (newExtractor.webhookUrl && extractions.length > 0) {
      extractions.forEach((rec) => {
        sendToWebhook(newExtractor.webhookUrl, {
          event: "extractor.record_created",
          extractorId: newExtractor.id,
          extractorName: newExtractor.name,
          record: rec,
        }).catch((err) => console.error("Webhook deferred dispatch crashed:", err));
      });
    }

    res.json(newExtractor);
  } catch (error: any) {
    console.error("Extractor creation breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to persist new extractor." });
  }
}
