import { Extractor } from "../../types";
import { loadExtractorContextById } from "./loadExtractorContextById";
import { normalizeExtractorSubjects } from "./normalizeExtractorSubjects";

export async function loadNormalizedExtractorById(
  extractorId: string,
  userId: string,
): Promise<Extractor | null> {
  const extractorContext = await loadExtractorContextById(extractorId, userId);
  if (!extractorContext) {
    return null;
  }

  return normalizeExtractorSubjects(extractorContext.extractor);
}
