import { Extractor } from "../../types";
import { saveExtractor } from "./saveExtractor";
import { syncExtractorSamplesWithSubjects } from "./syncExtractorSamplesWithSubjects";

export async function saveExtractorWithSubjectSamples(extractor: Extractor) {
  const syncedSamples = syncExtractorSamplesWithSubjects(extractor);
  extractor.sampleEmails = syncedSamples.sampleEmails;
  extractor.sampleExtractedResults = syncedSamples.sampleExtractedResults;
  await saveExtractor(extractor);
}
