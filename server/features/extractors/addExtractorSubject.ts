import { Request, Response } from "express";
import { extractEmailsWithSchema } from "../analyze/extractEmailsWithSchema";
import { getPersistedGmailAccessToken } from "../auth/getPersistedGmailAccessToken";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { fetchGmailEmailsBySubject } from "../emails/fetchGmailEmailsBySubject";
import { createExtractorSubject } from "./createExtractorSubject";
import { createExtractionRecordFromSchemaResult } from "./createExtractionRecordFromSchemaResult";
import { loadExtractorContextById } from "./loadExtractorContextById";
import { normalizeExtractorSubjects } from "./normalizeExtractorSubjects";
import { saveExtractor } from "./saveExtractor";
import { sendToWebhook } from "./sendToWebhook";

export async function addExtractorSubject(req: Request, res: Response) {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  const subject = String(req.body.subject || req.body.value || "").trim();

  if (!firebaseUser) return;

  const token = await getPersistedGmailAccessToken(req);

  if (!subject) {
    return res.status(400).json({ error: "Subject is required." });
  }

  if (!token) {
    return res.status(401).json({ error: "Connect Gmail before adding a subject and extracting matching emails." });
  }

  try {
    const extractorContext = await loadExtractorContextById(id, firebaseUser.uid);

    if (!extractorContext) {
      return res.status(404).json({ error: "Extractor not found." });
    }

    const extractor = normalizeExtractorSubjects(extractorContext.extractor);

    const alreadyRegistered = extractor.subjects.some(
      (registeredSubject) => registeredSubject.value.toLowerCase() === subject.toLowerCase(),
    );

    if (!alreadyRegistered) {
      extractor.subjects.push(createExtractorSubject(subject));
    }

    if (!extractor.query) {
      extractor.query = extractor.subjects[0]?.value || subject;
    }

    const targetSubject = extractor.subjects.find(
      (registeredSubject) => registeredSubject.value.toLowerCase() === subject.toLowerCase(),
    );
    const scannedAt = new Date().toISOString();
    const matchingEmails = await fetchGmailEmailsBySubject(token, subject, 10);
    const existingEmailIds = new Set(extractor.extractions.map((extraction) => extraction.emailId));
    const newEmails = matchingEmails.filter((email) => !existingEmailIds.has(email.id));

    if (targetSubject) {
      targetSubject.lastScannedAt = scannedAt;
    }

    extractor.triggerCount += 1;

    if (newEmails.length === 0) {
      await saveExtractor(extractor);
      return res.json({
        extractor,
        newCount: 0,
        scannedCount: matchingEmails.length,
        message: "Subject registered. No new matching emails were found for extraction.",
      });
    }

    const extractionResults = await extractEmailsWithSchema(newEmails, extractor.schemaFields, {
      extractorName: extractor.name,
      detectedType: extractor.detectedType,
      explanation: extractor.explanation,
    });

    const emailById = new Map(newEmails.map((email) => [email.id, email]));
    const newRecords = extractionResults.flatMap((result) => {
      const email = emailById.get(result.emailId);
      if (!email) return [];
      const record = createExtractionRecordFromSchemaResult(email, result, extractor.schemaFields);
      return record ? [record] : [];
    });

    if (newRecords.length > 0) {
      extractor.extractions = [...newRecords, ...extractor.extractions];
    }

    await saveExtractor(extractor);

    if (extractor.webhookUrl && newRecords.length > 0) {
      newRecords.forEach((record) => {
        sendToWebhook(extractor.webhookUrl, {
          event: "extractor.record_created",
          extractorId: extractor.id,
          extractorName: extractor.name,
          record,
        }).catch((err) => console.error("Webhook deferred dispatch crashed:", err));
      });
    }

    return res.json({
      extractor,
      newCount: newRecords.length,
      scannedCount: matchingEmails.length,
      message: `Subject registered. Gemini extracted ${newRecords.length} new record${newRecords.length === 1 ? "" : "s"} with the current schema.`,
    });
  } catch (error: any) {
    const message = error.message || "Failed to add extractor subject.";
    console.error("Add extractor subject breakdown:", error);
    return res.status(500).json({ error: message });
  }
}
