import { Request, Response } from "express";
import { Extractor, ExtractionRecord } from "../../types";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { getUniqueSubjectValues } from "./getUniqueSubjectValues";
import { saveExtractor } from "./saveExtractor";
import { createOperationRecord } from "../operations/createOperationRecord";
import { sendExtractorRecordWebhooks } from "./sendExtractorRecordWebhooks";
import { saveNewOperationsWithComputedFields } from "../computed/saveNewOperationsWithComputedFields";
import { normalizeComputedSchemaFields } from "../computed/normalizeComputedSchemaFields";
import { createExtractorStoredSamples } from "./createExtractorStoredSamples";
import { createSampleExtractedResults } from "./createSampleExtractedResults";
import { createValidationSample } from "./createValidationSample";
import { createValidatedExtractorSubject } from "./createValidatedExtractorSubject";
import { createExtractorSubject } from "./createExtractorSubject";
import { syncExtractorSamplesWithSubjects } from "./syncExtractorSamplesWithSubjects";

/**
 * Creates and persists a new email extractor containing layout descriptions,
 * parsing routines, and initial matching message extractions.
 */
export async function createExtractor(req: Request, res: Response) {
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  const {
    name,
    query,
    explanation,
    subjectScripts,
    schemaFields,
    subjects,
    webhookUrl,
    enabledSchedule,
    initialEmails,
    initialResults,
  } = req.body;

  if (!name || !query || !Array.isArray(subjectScripts) || subjectScripts.length === 0 || !schemaFields) {
    return res.status(400).json({ error: "Missing required extractor definition parameters (name, query, subjectScripts, or schema)." });
  }

  try {
    const normalizedSchemaFields = normalizeComputedSchemaFields(schemaFields);
    const storedSamples = createExtractorStoredSamples(initialEmails, initialResults);

    // Create unique ID
    const extractorId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const subjectValues = getUniqueSubjectValues([
      ...(Array.isArray(subjects) ? subjects : []),
      query,
    ]);
    const normalizedSubjectScripts = subjectScripts
      .map((entry: any) => ({
        subject: String(entry?.subject || "").trim(),
        scriptCode: String(entry?.scriptCode || "").trim(),
        validationSample: entry?.validationSample && typeof entry.validationSample === "object"
          ? entry.validationSample
          : null,
      }))
      .filter((entry) => entry.subject && entry.scriptCode);

    if (normalizedSubjectScripts.length === 0) {
      return res.status(400).json({ error: "At least one subjectScripts pair is required." });
    }

    const validatedSubjects = normalizedSubjectScripts.map((entry) => {
      const matchingSampleEmail = storedSamples.sampleEmails.find(
        (sampleEmail) => sampleEmail.subject.trim().toLowerCase() === entry.subject.toLowerCase(),
      );
      const validationSample = createValidationSample(entry.validationSample, entry.subject) || (
        matchingSampleEmail
          ? createValidationSample(matchingSampleEmail, entry.subject)
          : null
      );

      if (!validationSample) {
        throw new Error(`Subject "${entry.subject}" requires validationSample.body or a matching initial email.`);
      }

      return createValidatedExtractorSubject({
        schemaFields: normalizedSchemaFields,
        subject: entry.subject,
        scriptCode: entry.scriptCode,
        validationSample,
      }).subject;
    });

    // Build initial extractions from results
    const extractions: ExtractionRecord[] = [];
    if (initialEmails && Array.isArray(initialEmails)) {
      initialEmails.forEach((mail: any) => {
        // Find matching parsed result
        const matchRes = initialResults?.find((r: any) => r.emailId === mail.id);
        if (matchRes) {
          try {
            const parsedData = JSON.parse(matchRes.extractedData);
            extractions.push(createOperationRecord(extractorId, mail, parsedData));
          } catch (e) {
            console.warn(`Initial result parsing crashed for mail ${mail.id}:`, e);
          }
        }
      });
    }

    const newExtractor: Extractor = {
      id: extractorId,
      userId: firebaseUser.uid,
      name,
      query: subjectValues[0] || query,
      subjects: subjectValues.map((value) => {
        const validatedSubject = validatedSubjects.find((entry) => entry.value.toLowerCase() === value.toLowerCase()) || validatedSubjects[0];
        return createExtractorSubject(
          value,
          validatedSubject.scriptCode,
          validatedSubject.validationSample,
          validatedSubject.validationResult,
        );
      }),
      explanation: explanation || "",
      schemaFields: normalizedSchemaFields,
      sampleEmails: storedSamples.sampleEmails,
      sampleExtractedResults: [],
      webhookUrl: webhookUrl || "",
      enabledSchedule: !!enabledSchedule,
      triggerCount: extractions.length > 0 ? 1 : 0,
      operationCount: 0,
      extractions: [],
      createdAt: new Date().toISOString(),
    };

    const syncedSamples = syncExtractorSamplesWithSubjects(newExtractor);
    newExtractor.sampleEmails = syncedSamples.sampleEmails;
    newExtractor.sampleExtractedResults = syncedSamples.sampleExtractedResults;

    await saveExtractor(newExtractor);
    const savedExtractions = await saveNewOperationsWithComputedFields({
      extractor: newExtractor,
      userId: firebaseUser.uid,
      records: extractions,
    });
    newExtractor.operationCount = savedExtractions.length;
    newExtractor.extractions = savedExtractions;

    sendExtractorRecordWebhooks(newExtractor.webhookUrl, "extractor.record_created", newExtractor.id, newExtractor.name, savedExtractions);

    res.json(newExtractor);
  } catch (error: any) {
    console.error("Extractor creation breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to persist new extractor." });
  }
}
