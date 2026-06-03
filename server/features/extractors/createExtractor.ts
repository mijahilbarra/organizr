import { Request, Response } from "express";
import { Extractor, ExtractionRecord, ExtractorSubjectScript } from "../../types";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { createExtractorSubject } from "./createExtractorSubject";
import { getUniqueSubjectValues } from "./getUniqueSubjectValues";
import { saveExtractor } from "./saveExtractor";
import { createOperationRecord } from "../operations/createOperationRecord";
import { sendExtractorRecordWebhooks } from "./sendExtractorRecordWebhooks";
import { saveNewOperationsWithComputedFields } from "../computed/saveNewOperationsWithComputedFields";
import { normalizeComputedSchemaFields } from "../computed/normalizeComputedSchemaFields";
import { createExtractorStoredSamples } from "./createExtractorStoredSamples";
import { createSampleExtractedResults } from "./createSampleExtractedResults";

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
    const storedSamples = createExtractorStoredSamples(initialEmails, initialResults);

    // Create unique ID
    const extractorId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const subjectValues = getUniqueSubjectValues([
      ...(Array.isArray(subjects) ? subjects : []),
      query,
    ]);
    const normalizedSubjectScripts: ExtractorSubjectScript[] = subjectScripts
      .map((entry: any) => ({
        subject: String(entry?.subject || "").trim(),
        scriptCode: String(entry?.scriptCode || "").trim(),
      }))
      .filter((entry) => entry.subject && entry.scriptCode);

    if (normalizedSubjectScripts.length === 0) {
      return res.status(400).json({ error: "At least one subjectScripts pair is required." });
    }

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
        const scriptPair = normalizedSubjectScripts.find((entry) => entry.subject.toLowerCase() === value.toLowerCase()) || normalizedSubjectScripts[0];
        return createExtractorSubject(value, scriptPair.scriptCode);
      }),
      explanation: explanation || "",
      schemaFields: normalizeComputedSchemaFields(schemaFields),
      sampleEmails: storedSamples.sampleEmails,
      sampleExtractedResults: [],
      webhookUrl: webhookUrl || "",
      enabledSchedule: !!enabledSchedule,
      triggerCount: extractions.length > 0 ? 1 : 0,
      operationCount: 0,
      extractions: [],
      createdAt: new Date().toISOString(),
    };

    newExtractor.sampleExtractedResults = createSampleExtractedResults(
      newExtractor.sampleEmails,
      newExtractor.subjects,
    );

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
