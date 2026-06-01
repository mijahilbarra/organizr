import { ExtractionRecord } from "../../types";
import { createOperationDocumentId } from "./createOperationDocumentId";

export function createOperationRecord(
  extractorId: string,
  email: { id: string; subject?: string; date?: string; from?: string },
  extractedData: Record<string, any>,
): ExtractionRecord {
  return {
    id: createOperationDocumentId(extractorId, email.id),
    emailId: email.id,
    subject: email.subject || "No Subject",
    date: email.date || "Unknown Date",
    from: email.from || "Unknown Sender",
    extractedData,
    timestamp: new Date().toISOString(),
  };
}
