import { Request } from "express";
import { ValidationSample } from "../../../src/types";
import { createValidationSample } from "../extractors/createValidationSample";
import { findValidationEmailBySubject } from "./findValidationEmailBySubject";

export function createGptExtractorRequest(
  req: Request,
  analysis: any,
  subject: string,
  emails: any[],
  providedValidationSample?: ValidationSample | null,
): Request {
  const extractorName = req.body?.name || subject;
  const validationEmail = findValidationEmailBySubject(emails, subject);
  const validationSample = createValidationSample(providedValidationSample, subject)
    || createValidationSample(validationEmail, subject);

  return {
    ...req,
    body: {
      name: extractorName,
      query: subject,
      explanation: analysis.explanation || "",
      schemaFields: analysis.schemaFields || [],
      subjectScripts: [
        {
          subject,
          scriptCode: analysis.scriptCode,
          validationSample: validationSample || undefined,
        },
      ],
      subjects: [subject],
      webhookUrl: req.body?.webhookUrl || "",
      enabledSchedule: Boolean(req.body?.enabledSchedule),
      initialEmails: emails,
      initialResults: analysis.sampleExtractedResults || [],
    },
  } as Request;
}
