import { Extractor } from "../../types";
import { getExtractorByIdForUser } from "./getExtractorByIdForUser";

export async function loadExtractorContextById(id: string, userId: string): Promise<{
  extractor: Extractor;
} | null> {
  const extractor = await getExtractorByIdForUser(id, userId);

  if (!extractor) {
    return null;
  }

  return {
    extractor,
  };
}
