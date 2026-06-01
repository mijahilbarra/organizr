import { getExtractorByIdForUser } from "./getExtractorByIdForUser";
import { getExtractorsCollection } from "./getExtractorsCollection";

export async function deleteExtractorById(id: string, userId: string): Promise<boolean> {
  const extractor = await getExtractorByIdForUser(id, userId);

  if (!extractor) {
    return false;
  }

  const extractorsCollection = await getExtractorsCollection();
  await extractorsCollection.doc(id).delete();

  return true;
}
