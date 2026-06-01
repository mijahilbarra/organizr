import { Extractor, ExtractorSubject } from "../../types";
import { normalizeExtractorSubjects } from "./normalizeExtractorSubjects";

export function getExtractorSubjects(extractor: Extractor): ExtractorSubject[] {
  return normalizeExtractorSubjects(extractor).subjects;
}
