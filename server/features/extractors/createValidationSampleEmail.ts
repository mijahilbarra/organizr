import { EmailMessage, ValidationSample } from "../../../src/types";

export function createValidationSampleEmail(
  validationSample: ValidationSample,
  emailId: string,
): EmailMessage {
  const subject = String(validationSample.subject || "").trim();
  const body = String(validationSample.body || "");

  return {
    id: emailId,
    threadId: "",
    subject,
    from: typeof validationSample.from === "string" ? validationSample.from : "",
    date: "",
    snippet: body.slice(0, 200),
    body,
  };
}
