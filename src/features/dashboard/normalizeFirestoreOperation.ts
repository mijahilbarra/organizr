import type { ExtractionRecord } from "../../types";

const normalizeFirestoreDate = (value: unknown): string => {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return typeof value === "string" ? value : "";
};

export const normalizeFirestoreOperation = (id: string, data: unknown): ExtractionRecord => {
  const source = data && typeof data === "object" ? data as Partial<ExtractionRecord> : {};

  return {
    id: source.id || id,
    emailId: source.emailId || "",
    subject: source.subject || "No Subject",
    date: source.date || "Unknown Date",
    from: source.from || "Unknown Sender",
    extractedData: source.extractedData && typeof source.extractedData === "object" ? source.extractedData : {},
    timestamp: normalizeFirestoreDate(source.timestamp),
    computedStatus: source.computedStatus === "pending" ? "pending" : source.computedStatus === "complete" ? "complete" : undefined,
    pendingComputedFields: Array.isArray(source.pendingComputedFields) ? source.pendingComputedFields : [],
  };
};
