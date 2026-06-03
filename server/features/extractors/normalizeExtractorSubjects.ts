import { Extractor } from "../../types";

export function normalizeExtractorSubjects(extractor: Extractor): Extractor {
  const subjects = Array.isArray(extractor.subjects)
    ? extractor.subjects.filter((subject) => subject && subject.value?.trim())
    : [];

  return {
    ...extractor,
    subjects,
  };
}
