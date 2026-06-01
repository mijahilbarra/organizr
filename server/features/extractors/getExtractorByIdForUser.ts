import { Extractor } from "../../types";
import { getExtractorsCollection } from "./getExtractorsCollection";
import { normalizeFirestoreExtractor } from "./normalizeFirestoreExtractor";

export async function getExtractorByIdForUser(id: string, userId: string): Promise<Extractor | null> {
  const extractorsCollection = await getExtractorsCollection();
  const extractorSnapshot = await extractorsCollection.doc(id).get();

  if (!extractorSnapshot.exists) {
    return null;
  }

  const extractor = normalizeFirestoreExtractor(id, extractorSnapshot.data());

  if (extractor.userId !== userId) {
    return null;
  }

  return extractor;
}
