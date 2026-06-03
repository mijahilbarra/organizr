import { createGptActionResponse } from "../gpt/createGptActionResponse";

export function createExtractorNotFoundActionResponse(
  context: Record<string, unknown>,
) {
  return createGptActionResponse(
    "EXTRACTOR_NOT_FOUND",
    "Extractor not found.",
    context,
  );
}
