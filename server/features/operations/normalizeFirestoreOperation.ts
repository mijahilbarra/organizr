import { ExtractionRecord } from "../../types";

export function normalizeFirestoreOperation(id: string, data: unknown): ExtractionRecord {
  const source = data && typeof data === "object" ? data as Partial<ExtractionRecord> : {};

  return {
    id: source.id || id,
    emailId: source.emailId || "",
    subject: source.subject || "No Subject",
    date: source.date || "Unknown Date",
    from: source.from || "Unknown Sender",
    extractedData: source.extractedData && typeof source.extractedData === "object" ? source.extractedData : {},
    timestamp: source.timestamp || "",
    computedStatus: source.computedStatus === "pending" ? "pending" : source.computedStatus === "complete" ? "complete" : undefined,
    pendingComputedFields: Array.isArray(source.pendingComputedFields) ? source.pendingComputedFields : [],
  };
}
