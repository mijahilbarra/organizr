import { getExtractorByIdForUser } from "../extractors/getExtractorByIdForUser";
import { createGptActionResponse } from "./createGptActionResponse";

export async function ensureGptTargetExtractorExists(
  extractorId: string,
  userId: string,
  capabilities: Record<string, unknown>,
  subject: string,
) {
  if (!extractorId) {
    return null;
  }

  const currentExtractor = await getExtractorByIdForUser(extractorId, userId);

  if (currentExtractor) {
    return null;
  }

  return {
    statusCode: 404,
    body: createGptActionResponse("EXTRACTOR_NOT_FOUND", "The target extractor was not found.", {
      capabilities,
      subject,
      extractorId,
      mode: "attach-subject",
    }),
  };
}
