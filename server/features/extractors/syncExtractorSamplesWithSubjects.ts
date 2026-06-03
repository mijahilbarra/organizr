import { Extractor } from "../../types";
import { createSampleExtractedResults } from "./createSampleExtractedResults";
import { mergeSampleEmailsWithSubjects } from "./mergeSampleEmailsWithSubjects";

export function syncExtractorSamplesWithSubjects(
  extractor: Pick<Extractor, "sampleEmails" | "subjects">,
) {
  const sampleEmails = mergeSampleEmailsWithSubjects(
    extractor.sampleEmails,
    extractor.subjects,
  );

  return {
    sampleEmails,
    sampleExtractedResults: createSampleExtractedResults(
      sampleEmails,
      extractor.subjects,
    ),
  };
}
