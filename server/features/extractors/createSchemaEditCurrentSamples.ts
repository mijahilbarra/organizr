import { Extractor } from "../../types";

export function createSchemaEditCurrentSamples(extractor: Extractor) {
  return {
    sampleEmails: extractor.sampleEmails,
    sampleExtractedResults: extractor.sampleExtractedResults,
  };
}
