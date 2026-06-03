import { createValidationSample } from "../extractors/createValidationSample";
import { findValidationEmailBySubject } from "./findValidationEmailBySubject";

export function resolveValidationSampleForGptAnalysis(
  body: any,
  subject: string,
  emails: any[],
) {
  const directValidationSample = createValidationSample(body?.validationSample, subject);
  if (directValidationSample) {
    return directValidationSample;
  }

  const analysisValidationSample = createValidationSample(body?.analysis?.validationSample, subject);
  if (analysisValidationSample) {
    return analysisValidationSample;
  }

  const validationEmail = findValidationEmailBySubject(emails, subject);
  return createValidationSample(validationEmail, subject);
}
