import { Response } from "express";
import { createExtractorNotFoundActionResponse } from "./createExtractorNotFoundActionResponse";
import { loadNormalizedExtractorById } from "./loadNormalizedExtractorById";

export async function loadRequiredNormalizedExtractorForSubjectMutation(
  res: Response,
  extractorId: string,
  userId: string,
  context: Record<string, unknown>,
) {
  const extractor = await loadNormalizedExtractorById(extractorId, userId);
  if (!extractor) {
    res.status(404).json(createExtractorNotFoundActionResponse(context));
    return null;
  }

  return extractor;
}
