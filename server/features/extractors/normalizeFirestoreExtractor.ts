import { Extractor } from "../../types";
import { normalizeExtractorSubjects } from "./normalizeExtractorSubjects";

export function normalizeFirestoreExtractor(id: string, data: unknown): Extractor {
  const source = data && typeof data === "object" ? data as Partial<Extractor> : {};
  const extractor = normalizeExtractorSubjects({
    id: source.id || id,
    userId: source.userId || "",
    name: source.name || "",
    query: source.query || "",
    subjects: Array.isArray(source.subjects) ? source.subjects : [],
    detectedType: source.detectedType || "Custom",
    explanation: source.explanation || "",
    scriptCode: source.scriptCode || "",
    aiScriptCode: source.aiScriptCode || "",
    schemaFields: Array.isArray(source.schemaFields) ? source.schemaFields : [],
    webhookUrl: source.webhookUrl || "",
    enabledSchedule: !!source.enabledSchedule,
    triggerCount: typeof source.triggerCount === "number" ? source.triggerCount : 0,
    operationCount: typeof source.operationCount === "number"
      ? source.operationCount
      : Array.isArray(source.extractions) ? source.extractions.length : 0,
    extractions: [],
    createdAt: source.createdAt || "",
  });

  return extractor;
}
