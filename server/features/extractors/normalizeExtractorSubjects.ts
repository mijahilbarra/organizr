import { Extractor } from "../../types";
import { createExtractorSubject } from "./createExtractorSubject";

export function normalizeExtractorSubjects(extractor: Extractor): Extractor {
  const subjects = Array.isArray(extractor.subjects)
    ? extractor.subjects.filter((subject) => subject && subject.value?.trim())
    : [];

  if (subjects.length > 0) {
    return {
      ...extractor,
      subjects,
      query: extractor.query || subjects[0].value,
    };
  }

  const fallbackQuery = extractor.query?.trim();
  if (!fallbackQuery) {
    return {
      ...extractor,
      subjects: [],
    };
  }

  return {
    ...extractor,
    subjects: [createExtractorSubject(fallbackQuery)],
  };
}
