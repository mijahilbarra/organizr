import { Request } from "express";

export function createGptExtractorRequest(req: Request, analysis: any, subject: string, emails: any[]): Request {
  const extractorName = req.body?.name || subject;

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
