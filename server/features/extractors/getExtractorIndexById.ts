import { DatabaseSchema } from "../../types";

export function getExtractorIndexById(db: DatabaseSchema, id: string): number {
  return db.extractors.findIndex((extractor) => extractor.id === id);
}
