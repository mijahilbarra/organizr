import { Extractor } from "../../types";
import { getExtractorsCollection } from "./getExtractorsCollection";

export async function saveExtractor(extractor: Extractor): Promise<void> {
  const extractorsCollection = await getExtractorsCollection();
  await extractorsCollection.doc(extractor.id).set(extractor, { merge: false });
}
