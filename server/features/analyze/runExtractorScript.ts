import { compileExtractorScript } from "./compileExtractorScript";

interface ExtractorEmailInput {
  id: string;
  body?: string;
  snippet?: string;
  subject?: string;
  from?: string;
}

export interface ExtractorScriptRunResult {
  emailId: string;
  extractedData: Record<string, any> | null;
  success: boolean;
  error?: string;
}

export function runExtractorScript(scriptCode: string, emails: ExtractorEmailInput[]): ExtractorScriptRunResult[] {
  const extractFn = compileExtractorScript(scriptCode);

  return emails.map((email) => {
    try {
      const bodyContent = email.body || email.snippet || "";
      const data = extractFn(bodyContent, email.subject || "", email.from || "");

      return {
        emailId: email.id,
        extractedData: data,
        success: true,
      };
    } catch (error: any) {
      return {
        emailId: email.id,
        extractedData: null,
        success: false,
        error: error.message,
      };
    }
  });
}
