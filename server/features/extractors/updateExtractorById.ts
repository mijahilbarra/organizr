import { readDb } from "../../db/readDb";
import { writeDb } from "../../db/writeDb";
import { Extractor } from "../../types";
import { getExtractorIndexById } from "./getExtractorIndexById";

export async function updateExtractorById(
  id: string,
  updateExtractor: (extractor: Extractor) => void,
): Promise<Extractor | null> {
  const dbObj = await readDb();
  const idx = getExtractorIndexById(dbObj, id);

  if (idx === -1) {
    return null;
  }

  updateExtractor(dbObj.extractors[idx]);
  await writeDb(dbObj);

  return dbObj.extractors[idx];
}
