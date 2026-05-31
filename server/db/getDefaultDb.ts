import { DatabaseSchema } from "../types";

export function getDefaultDb(): DatabaseSchema {
  return { extractors: [] };
}
