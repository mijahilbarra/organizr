export function createOperationDocumentId(extractorId: string, emailId: string): string {
  return `${extractorId}_${emailId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
