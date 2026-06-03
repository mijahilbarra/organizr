import { ExtractorSubject } from "../../types";

export function createExtractorSubject(
  value: string,
  scriptCode?: string,
): ExtractorSubject {
  return {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    value,
    createdAt: new Date().toISOString(),
    scriptCode,
  };
}
