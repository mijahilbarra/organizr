import { SchemaField, SubjectValidationResult, ValidationSample } from "../../../src/types";
import { ExtractorSubject } from "../../types";
import { createValidationSample } from "./createValidationSample";
import { createExtractorSubject } from "./createExtractorSubject";
import { validateSchemaAgainstSample } from "./validateSchemaAgainstSample";

interface CreateValidatedExtractorSubjectParams {
  schemaFields: SchemaField[];
  subject: string;
  scriptCode: string;
  validationSample: ValidationSample;
  subjectId?: string;
  createdAt?: string;
  lastScannedAt?: string;
}

export function createValidatedExtractorSubject({
  schemaFields,
  subject,
  scriptCode,
  validationSample,
  subjectId,
  createdAt,
  lastScannedAt,
}: CreateValidatedExtractorSubjectParams): { subject: ExtractorSubject; validationResult: SubjectValidationResult } {
  const normalizedSample = createValidationSample(validationSample, subject);
  if (!normalizedSample) {
    throw new Error(`Subject "${subject}" requires validationSample.body.`);
  }

  const validation = validateSchemaAgainstSample(schemaFields, scriptCode, normalizedSample);

  if (!validation.ok || !validation.output) {
    throw new Error(validation.message || "The parser output did not match the schemaFields.");
  }

  const validationResult: SubjectValidationResult = {
    emailId: `sample_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    extractedData: JSON.stringify(validation.output),
    validatedAt: new Date().toISOString(),
  };
  const nextSubject = createExtractorSubject(subject, scriptCode, normalizedSample, validationResult);

  if (subjectId) {
    nextSubject.id = subjectId;
  }

  if (createdAt) {
    nextSubject.createdAt = createdAt;
  }

  if (lastScannedAt) {
    nextSubject.lastScannedAt = lastScannedAt;
  }

  return {
    subject: nextSubject,
    validationResult,
  };
}
