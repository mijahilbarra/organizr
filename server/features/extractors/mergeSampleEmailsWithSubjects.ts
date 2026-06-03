import { EmailMessage } from "../../../src/types";
import { ExtractorSubject } from "../../types";
import { createValidationSampleEmail } from "./createValidationSampleEmail";

export function mergeSampleEmailsWithSubjects(
  sampleEmails: EmailMessage[],
  subjects: ExtractorSubject[],
): EmailMessage[] {
  const nextSampleEmails = [...sampleEmails];

  for (const subject of subjects) {
    if (!subject.validationSample || !subject.validationResult) {
      continue;
    }

    const validationEmail = createValidationSampleEmail(
      subject.validationSample,
      subject.validationResult.emailId,
    );
    const existingIndex = nextSampleEmails.findIndex((entry) => entry.id === validationEmail.id);

    if (existingIndex >= 0) {
      nextSampleEmails[existingIndex] = validationEmail;
      continue;
    }

    nextSampleEmails.push(validationEmail);
  }

  return nextSampleEmails;
}
