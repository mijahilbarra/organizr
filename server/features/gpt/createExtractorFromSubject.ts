import { Request, Response } from "express";
import { analyzeEmails } from "../analyze/analyzeEmails";
import { getPersistedGmailAccessToken } from "../auth/getPersistedGmailAccessToken";
import { fetchGmailEmailsBySubject } from "../emails/fetchGmailEmailsBySubject";
import { loadUserProfileForRequest } from "../profile/loadUserProfileForRequest";
import { captureExpressJson } from "./captureExpressJson";
import { createGptActionResponse } from "./createGptActionResponse";
import { createGptCapabilities } from "./createGptCapabilities";
import { ensureGptTargetExtractorExists } from "./ensureGptTargetExtractorExists";
import { createPersistedGptExtractorResponse } from "./createPersistedGptExtractorResponse";
import { persistGptAnalysisResult } from "./persistGptAnalysisResult";

export async function createExtractorFromSubject(req: Request, res: Response) {
  const subject = String(req.body?.subject || "").trim();
  const extractorId = String(req.body?.extractorId || "").trim();
  const maxResults = Math.min(Number(req.body?.maxResults || 1), 20);
  const loaded = await loadUserProfileForRequest(req);
  const capabilities = createGptCapabilities(loaded?.profile || null);

  if (!subject) {
    return res.status(400).json(createGptActionResponse("SUBJECT_REQUIRED", "Provide the Gmail subject to search.", { capabilities }));
  }

  if (!capabilities.gmailConnected) {
    return res.status(409).json(createGptActionResponse("GMAIL_CONNECTION_REQUIRED", "Connect Gmail before creating an extractor from Custom GPT.", { capabilities }));
  }

  if (extractorId && loaded?.profile) {
    const missingTarget = await ensureGptTargetExtractorExists(extractorId, loaded.profile.uid, capabilities, subject);
    if (missingTarget) {
      return res.status(missingTarget.statusCode).json(missingTarget.body);
    }
  }

  const token = await getPersistedGmailAccessToken(req);
  if (!token) {
    return res.status(409).json(createGptActionResponse("GMAIL_CONNECTION_REQUIRED", "Reconnect Gmail because the stored Gmail token is missing or expired.", { capabilities }));
  }

  try {
    const emails = await fetchGmailEmailsBySubject(token, subject, maxResults);

    if (emails.length === 0) {
      return res.status(404).json(createGptActionResponse("NO_EMAILS_FOUND", "No Gmail messages matched that subject.", { capabilities, subject }));
    }

    if (
      req.body?.provider === "customgpt"
      || (!capabilities.availableProviders.includes("gemini") && !capabilities.availableProviders.includes("openai"))
    ) {
      return res.status(200).json(createGptActionResponse("CUSTOM_GPT_ANALYSIS_REQUIRED", "Use these Gmail samples to generate the extractor schema and parser, then call createExtractorFromCustomGptAnalysis.", {
        capabilities,
        subject,
        extractorId,
        mode: "customgpt-manual-analysis",
        emailCount: emails.length,
        emails,
        targetExtractor: extractorId,
        expectedAnalysisShape: {
          explanation: "string",
          schemaFields: [{ fieldName: "camelCase", fieldType: "string|number|boolean|array", description: "string", exampleValue: "string" }],
          scriptCode: "JavaScript function extractData(body, subject, sender) { return {...}; }",
          sampleExtractedResults: [{ emailId: "string", extractedData: "JSON string" }],
        },
      }));
    }

    if (!capabilities.llmAvailable) {
      return res.status(409).json(createGptActionResponse("LLM_PROVIDER_REQUIRED", "Sign in before analyzing emails with Custom GPT.", { capabilities }));
    }

    const analysisRequest = { ...req, body: { emails, provider: req.body?.provider || "auto" } } as Request;
    const analysis = await captureExpressJson(analyzeEmails, analysisRequest);

    if (analysis.statusCode >= 400 || analysis.body?.error) {
      return res.status(502).json(createGptActionResponse("ANALYSIS_FAILED", analysis.body?.error || "Email analysis failed.", {
        capabilities,
        subject,
        mode: "llm-analysis",
      }));
    }

    const persisted = await persistGptAnalysisResult(req, loaded?.profile?.uid || "", analysis.body, subject, emails);
    const response = createPersistedGptExtractorResponse(
      persisted,
      capabilities,
      subject,
      extractorId,
      emails.length,
      "Extractor created from Gmail subject.",
      "Subject added to existing extractor.",
    );
    return res.status(response.statusCode).json(response.body);
  } catch (error: any) {
    console.error("Custom GPT extractor orchestration failed:", error);
    return res.status(500).json(createGptActionResponse("UNEXPECTED_ERROR", error.message || "Custom GPT orchestration failed.", {
      capabilities,
      subject,
      mode: extractorId ? "attach-subject" : "create-extractor",
    }));
  }
}
