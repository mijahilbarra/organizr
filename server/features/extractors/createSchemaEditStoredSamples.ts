import { EmailMessage, SampleExtractionResult } from "../../../src/types";
import { Extractor } from "../../types";
import { createValidationSample } from "./createValidationSample";
import { createValidationSampleEmail } from "./createValidationSampleEmail";

function createStoredValidationSampleEmail(entry: any, index: number): EmailMessage | null {
  const fallbackSubject = String(entry?.subject ?? entry?.value ?? "").trim();
  const validationSample = createValidationSample(entry?.validationSample, fallbackSubject);
  if (!validationSample) return null;

  return createValidationSampleEmail(validationSample, `sample_${Date.now()}_${index}`);
}

export function createSchemaEditStoredSamples(extractor: Extractor, body: any) {
  const subjectEntries = Array.isArray(body?.subjects)
    ? body.subjects
    : Array.isArray(body?.subjectScripts)
      ? body.subjectScripts
      : Array.isArray(body?.analysis?.subjects)
        ? body.analysis.subjects
        : Array.isArray(body?.analysis?.subjectScripts)
          ? body.analysis.subjectScripts
          : [];

  const validationSampleEmails = subjectEntries
    .map((entry: any, index: number) => createStoredValidationSampleEmail(entry, index))
    .filter((entry): entry is EmailMessage => Boolean(entry));

  if (validationSampleEmails.length === 0) {
    return {
      sampleEmails: extractor.sampleEmails,
      sampleExtractedResults: extractor.sampleExtractedResults,
    };
  }

  const sampleEmails = [...extractor.sampleEmails];
  for (const sampleEmail of validationSampleEmails) {
    const existingIndex = sampleEmails.findIndex((entry) =>
      entry.subject === sampleEmail.subject && entry.body === sampleEmail.body,
    );
    if (existingIndex >= 0) {
      sampleEmails[existingIndex] = sampleEmail;
    } else {
      sampleEmails.push(sampleEmail);
    }
  }

  const validEmailIds = new Set(sampleEmails.map((entry) => entry.id));
  const sampleExtractedResults = extractor.sampleExtractedResults
    .filter((entry: SampleExtractionResult) => validEmailIds.has(entry.emailId));

  return {
    sampleEmails,
    sampleExtractedResults,
  };
}
