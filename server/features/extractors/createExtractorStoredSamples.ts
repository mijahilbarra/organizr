import { EmailMessage, SampleExtractionResult } from "../../../src/types";

interface ExtractorStoredSamples {
  sampleEmails: EmailMessage[];
  sampleExtractedResults: SampleExtractionResult[];
}

export function createExtractorStoredSamples(
  initialEmails: unknown,
  initialResults: unknown,
): ExtractorStoredSamples {
  const sampleEmails = Array.isArray(initialEmails)
    ? initialEmails
      .filter((entry) => entry && typeof entry === "object")
      .map((entry: any) => ({
        id: String(entry.id || "").trim(),
        threadId: String(entry.threadId || "").trim(),
        subject: String(entry.subject || "").trim(),
        from: String(entry.from || "").trim(),
        date: String(entry.date || "").trim(),
        snippet: String(entry.snippet || "").trim(),
        body: String(entry.body || ""),
      }))
      .filter((entry) => entry.id && entry.subject && entry.body)
    : [];
  const sampleExtractedResults = Array.isArray(initialResults)
    ? initialResults
      .filter((entry) => entry && typeof entry === "object")
      .map((entry: any) => ({
        emailId: String(entry.emailId || "").trim(),
        extractedData: String(entry.extractedData || "").trim(),
      }))
      .filter((entry) => entry.emailId && entry.extractedData)
    : [];

  return {
    sampleEmails,
    sampleExtractedResults,
  };
}
