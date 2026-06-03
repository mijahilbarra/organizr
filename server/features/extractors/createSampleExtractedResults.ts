import { EmailMessage, SampleExtractionResult } from "../../../src/types";
import { ExtractorSubject } from "../../types";
import { runExtractorScript } from "../analyze/runExtractorScript";

function findMatchingSubjectParser(subjects: ExtractorSubject[], sampleEmail: EmailMessage): string {
  const normalizedSubject = sampleEmail.subject.trim().toLowerCase();
  const exactMatch = subjects.find((subject) => subject.value.trim().toLowerCase() === normalizedSubject && subject.scriptCode);

  if (exactMatch?.scriptCode) {
    return exactMatch.scriptCode;
  }

  const fallbackMatch = subjects.find((subject) => subject.scriptCode);
  return fallbackMatch?.scriptCode || "";
}

export function createSampleExtractedResults(
  sampleEmails: EmailMessage[],
  subjects: ExtractorSubject[],
): SampleExtractionResult[] {
  return sampleEmails.flatMap((sampleEmail) => {
    const scriptCode = findMatchingSubjectParser(subjects, sampleEmail);
    if (!scriptCode) {
      return [];
    }

    const [result] = runExtractorScript(scriptCode, [sampleEmail]);
    if (!result?.success || !result.extractedData || typeof result.extractedData !== "object") {
      return [];
    }

    return [{
      emailId: sampleEmail.id,
      extractedData: JSON.stringify(result.extractedData),
    }];
  });
}
