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
import { sendExtractorRecordWebhooks } from "./sendExtractorRecordWebhooks";
import { listExistingOperationEmailIds } from "../operations/listExistingOperationEmailIds";
import { saveNewOperationsForExtractor } from "../operations/saveNewOperationsForExtractor";

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
    const existingEmailIds = await listExistingOperationEmailIds(extractor.id, matchingEmails.map((email) => email.id));
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
      const record = createExtractionRecordFromSchemaResult(extractor.id, email, result, extractor.schemaFields);
      return record ? [record] : [];
    });

    const savedRecords = await saveNewOperationsForExtractor(extractor.id, firebaseUser.uid, newRecords);
    extractor.operationCount += savedRecords.length;
    extractor.extractions = [];

    await saveExtractor(extractor);
    extractor.extractions = savedRecords;

    sendExtractorRecordWebhooks(extractor.webhookUrl, "extractor.record_created", extractor.id, extractor.name, savedRecords);

    return res.json({
      extractor,
      newCount: savedRecords.length,
      scannedCount: matchingEmails.length,
      message: `Subject registered. Gemini extracted ${savedRecords.length} new record${savedRecords.length === 1 ? "" : "s"} with the current schema.`,
    });
  } catch (error: any) {
    const message = error.message || "Failed to add extractor subject.";
    console.error("Add extractor subject breakdown:", error);
    return res.status(500).json({ error: message });
  }
}
