import { DatabaseSchema, Extractor } from "../types";
import { getDefaultDb } from "./getDefaultDb";

interface FirestoreDbData {
  extractors?: unknown;
}

export function normalizeDbSchema(data: FirestoreDbData | undefined): DatabaseSchema {
  if (!data || !Array.isArray(data.extractors)) {
    return getDefaultDb();
  }

  return {
    extractors: data.extractors as Extractor[],
  };
}
