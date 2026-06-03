import { Extractor, ExtractorSubject } from "../../types";
import { SchemaField } from "../../../src/types";

interface SchemaEditManualPayload {
  explanation: string;
  schemaFields: SchemaField[] | null;
  subjects: ExtractorSubject[] | null;
}

export function createSchemaEditManualPayload(body: any, currentExtractor: Extractor): SchemaEditManualPayload {
  const analysis = body?.analysis && typeof body.analysis === "object" ? body.analysis : null;
  const explanationSource = typeof body?.explanation === "string"
    ? body.explanation
    : typeof analysis?.explanation === "string"
      ? analysis.explanation
      : "";
  const schemaFields = Array.isArray(body?.schemaFields)
    ? body.schemaFields
    : Array.isArray(analysis?.schemaFields)
      ? analysis.schemaFields
      : null;
  const subjectEntries = Array.isArray(body?.subjects)
    ? body.subjects
    : Array.isArray(body?.subjectScripts)
      ? body.subjectScripts
      : Array.isArray(analysis?.subjects)
        ? analysis.subjects
        : Array.isArray(analysis?.subjectScripts)
          ? analysis.subjectScripts
          : null;
  const sharedScriptCode = typeof body?.scriptCode === "string" && body.scriptCode.trim()
    ? body.scriptCode.trim()
    : typeof analysis?.scriptCode === "string" && analysis.scriptCode.trim()
      ? analysis.scriptCode.trim()
      : "";

  if (subjectEntries) {
    return {
      explanation: explanationSource.trim(),
      schemaFields,
      subjects: subjectEntries
        .filter((entry) => entry && typeof entry === "object")
        .map((entry: any, index: number) => {
          const subjectId = typeof entry.subjectId === "string" && entry.subjectId.trim()
            ? entry.subjectId.trim()
            : typeof entry.id === "string" && entry.id.trim()
              ? entry.id.trim()
              : `sub_${Date.now()}_${index}`;
          const currentSubject = currentExtractor.subjects.find((subject) => subject.id === subjectId);

          return {
            id: subjectId,
            value: String(entry.subject ?? entry.value ?? "").trim(),
            createdAt: typeof entry.createdAt === "string" && entry.createdAt.trim()
              ? entry.createdAt.trim()
              : currentSubject?.createdAt || new Date().toISOString(),
            lastScannedAt: typeof entry.lastScannedAt === "string"
              ? entry.lastScannedAt
              : currentSubject?.lastScannedAt,
            scriptCode: typeof entry.scriptCode === "string" ? entry.scriptCode.trim() : "",
            validationSample: entry?.validationSample && typeof entry.validationSample === "object"
              ? entry.validationSample
              : currentSubject?.validationSample,
            validationResult: currentSubject?.validationResult,
          };
        })
        .filter((entry) => entry.value && entry.scriptCode),
    };
  }

  if (sharedScriptCode) {
    return {
      explanation: explanationSource.trim(),
      schemaFields,
      subjects: currentExtractor.subjects
        .map((subject) => ({
          ...subject,
          scriptCode: sharedScriptCode,
        }))
        .filter((subject) => subject.value && subject.scriptCode),
    };
  }

  return {
    explanation: explanationSource.trim(),
    schemaFields,
    subjects: null,
  };
}
