import { Extractor } from "../../types";
import { getExtractorsCollection } from "./getExtractorsCollection";
import { normalizeFirestoreExtractor } from "./normalizeFirestoreExtractor";

export async function listExtractorsForUser(userId: string): Promise<Extractor[]> {
  const extractorsCollection = await getExtractorsCollection();
  const snapshot = await extractorsCollection.where("userId", "==", userId).get();

  return snapshot.docs
    .map((doc) => normalizeFirestoreExtractor(doc.id, doc.data()))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
