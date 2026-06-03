import { Request, Response } from "express";
import { compileExtractorScript } from "../analyze/compileExtractorScript";
import { getPersistedGmailAccessToken } from "../auth/getPersistedGmailAccessToken";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { fetchGmailEmailsBySubject } from "../emails/fetchGmailEmailsBySubject";
import { ExtractionRecord } from "../../types";
import { getExtractorSubjects } from "./getExtractorSubjects";
import { loadExtractorContextById } from "./loadExtractorContextById";
import { saveExtractor } from "./saveExtractor";
import { createOperationRecord } from "../operations/createOperationRecord";
import { listExistingOperationEmailIds } from "../operations/listExistingOperationEmailIds";
import { sendExtractorRecordWebhooks } from "./sendExtractorRecordWebhooks";
import { normalizeGmailSearchDateRange } from "../emails/normalizeGmailSearchDateRange";
import { saveNewOperationsWithComputedFields } from "../computed/saveNewOperationsWithComputedFields";

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
    return res.status(401).json({ error: "Connect Gmail before executing inbox scans. Stored Gmail access is short-lived and must be renewed after it expires." });
  }

  try {
    const extractorContext = await loadExtractorContextById(id, firebaseUser.uid);

    if (!extractorContext) {
      return res.status(404).json({ error: `Extractor with ID '${id}' was not found.` });
    }

    const { extractor } = extractorContext;
    const dateRange = normalizeGmailSearchDateRange({
      after: req.body?.after,
      before: req.body?.before,
    });
    const extractorSubjects = getExtractorSubjects(extractor);
    extractor.subjects = extractorSubjects;

    if (extractorSubjects.length === 0) {
      return res.status(400).json({ error: "Extractor has no registered subjects to scan." });
    }

    const unparsedEmailsById = new Map<string, any>();
    const scannedAt = new Date().toISOString();

    // 1. Scan Gmail inbox using every registered subject for the shared extractor schema.
    for (const registeredSubject of extractorSubjects) {
      const emails = await fetchGmailEmailsBySubject(token, registeredSubject.value, 500, dateRange);
      registeredSubject.lastScannedAt = scannedAt;
      const existingEmailIds = await listExistingOperationEmailIds(extractor.id, emails.map((email) => email.id));

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

    const newRecords: ExtractionRecord[] = [];

    for (const detailData of unparsedEmailsById.values()) {
      try {
        const matchedSubject = extractorSubjects.find(
          (registeredSubject) => detailData.subject.toLowerCase().includes(registeredSubject.value.toLowerCase()),
        );
        const subjectScriptCode = matchedSubject?.scriptCode;
        const extractFn = compileExtractorScript(subjectScriptCode);

        // Run extraction logic
        const parsedData = extractFn(detailData.body, detailData.subject, detailData.from);

        const newRecord: ExtractionRecord = createOperationRecord(extractor.id, detailData, parsedData);

        newRecords.push(newRecord);
      } catch (err) {
        console.error(`Dynamic parsing error during triggering on message ${detailData.id}:`, err);
      }
    }

    const savedRecords = await saveNewOperationsWithComputedFields({
      extractor,
      userId: firebaseUser.uid,
      records: newRecords,
    });
    extractor.triggerCount += 1;
    extractor.operationCount += savedRecords.length;
    extractor.extractions = [];
    await saveExtractor(extractor);
    extractor.extractions = savedRecords;

    sendExtractorRecordWebhooks(extractor.webhookUrl, "extractor.record_discovered", extractor.id, extractor.name, savedRecords);

    res.json({
      message: `Scanned and successfully extracted ${savedRecords.length} new records!`,
      newCount: savedRecords.length,
      extractor,
    });

  } catch (error: any) {
    console.error("Scheduled trigger handler failed:", error);
    res.status(200).json({ error: error.message || "Something went wrong during dynamic extraction run." });
  }
}
