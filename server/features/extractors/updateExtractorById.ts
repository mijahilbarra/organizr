import { Extractor } from "../../types";
import { getExtractorByIdForUser } from "./getExtractorByIdForUser";
import { saveExtractor } from "./saveExtractor";

export async function updateExtractorById(
  id: string,
  userId: string,
  updateExtractor: (extractor: Extractor) => void,
): Promise<Extractor | null> {
  const extractor = await getExtractorByIdForUser(id, userId);

  if (!extractor) {
    return null;
  }

  updateExtractor(extractor);
  await saveExtractor(extractor);

  return extractor;
}
