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
      : null;

  if (subjectEntries) {
    return {
      explanation: explanationSource.trim(),
      schemaFields,
      subjects: subjectEntries
        .filter((entry) => entry && typeof entry === "object")
        .map((entry: any, index: number) => ({
          id: typeof entry.subjectId === "string" && entry.subjectId.trim()
            ? entry.subjectId.trim()
            : typeof entry.id === "string" && entry.id.trim()
              ? entry.id.trim()
              : `sub_${Date.now()}_${index}`,
          value: String(entry.subject ?? entry.value ?? "").trim(),
          createdAt: typeof entry.createdAt === "string" && entry.createdAt.trim()
            ? entry.createdAt.trim()
            : new Date().toISOString(),
          lastScannedAt: typeof entry.lastScannedAt === "string" ? entry.lastScannedAt : undefined,
          scriptCode: typeof entry.scriptCode === "string" ? entry.scriptCode.trim() : "",
        }))
        .filter((entry) => entry.value && entry.scriptCode),
    };
  }

  return {
    explanation: explanationSource.trim(),
    schemaFields,
    subjects: null,
  };
}
