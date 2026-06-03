import { createGptActionResponse } from "./createGptActionResponse";

export function createPersistedGptExtractorResponse(
  persisted: { created: boolean; statusCode: number; body: any },
  capabilities: Record<string, unknown>,
  subject: string,
  extractorId: string,
  emailCount: number,
  createdMessage: string,
  updatedMessage: string,
) {
  if (persisted.statusCode >= 400 || persisted.body?.error) {
    const actionCode = persisted.statusCode === 404
      ? "EXTRACTOR_NOT_FOUND"
      : persisted.statusCode === 409
        ? "SUBJECT_ALREADY_EXISTS"
        : "EXTRACTOR_CREATE_FAILED";

    return {
      statusCode: persisted.statusCode === 409 ? 409 : persisted.statusCode === 404 ? 404 : 502,
      body: createGptActionResponse(actionCode, persisted.body?.error || "Extractor persistence failed.", {
        capabilities,
        subject,
        extractorId,
        mode: extractorId ? "attach-subject" : "create-extractor",
      }),
    };
  }

  return {
    statusCode: 200,
    body: createGptActionResponse("READY", persisted.created ? createdMessage : updatedMessage, {
      capabilities,
      subject,
      extractorId,
      mode: persisted.created ? "create-extractor" : "attach-subject",
      emailCount,
      created: persisted.created,
      targetExtractorUpdated: !persisted.created,
      schemaChanged: persisted.created,
      extractor: persisted.body?.extractor || persisted.body,
    }),
  };
}
