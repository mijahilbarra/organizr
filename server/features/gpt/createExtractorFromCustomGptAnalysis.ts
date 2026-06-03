import { Request, Response } from "express";
import { createGptActionResponse } from "./createGptActionResponse";
import { createGptCapabilities } from "./createGptCapabilities";
import { loadUserProfileForRequest } from "../profile/loadUserProfileForRequest";
import { ensureGptTargetExtractorExists } from "./ensureGptTargetExtractorExists";
import { createPersistedGptExtractorResponse } from "./createPersistedGptExtractorResponse";
import { persistGptAnalysisResult } from "./persistGptAnalysisResult";
import { resolveValidationSampleForGptAnalysis } from "./resolveValidationSampleForGptAnalysis";

export async function createExtractorFromCustomGptAnalysis(req: Request, res: Response) {
  const subject = String(req.body?.subject || "").trim();
  const extractorId = String(req.body?.extractorId || "").trim();
  const loaded = await loadUserProfileForRequest(req);
  const capabilities = createGptCapabilities(loaded?.profile || null);
  const analysis = req.body?.analysis;
  const emails = Array.isArray(req.body?.emails) ? req.body.emails : [];

  if (!subject) {
    return res.status(400).json(createGptActionResponse("SUBJECT_REQUIRED", "Provide the Gmail subject used for this extractor.", { capabilities }));
  }

  if (!analysis?.scriptCode || !Array.isArray(analysis?.schemaFields)) {
    return res.status(400).json(createGptActionResponse("ANALYSIS_FAILED", "Provide Custom GPT generated scriptCode and schemaFields.", { capabilities, subject }));
  }

  if (extractorId && loaded?.profile) {
    const missingTarget = await ensureGptTargetExtractorExists(extractorId, loaded.profile.uid, capabilities, subject);
    if (missingTarget) {
      return res.status(missingTarget.statusCode).json(missingTarget.body);
    }
  }

  const validationSample = resolveValidationSampleForGptAnalysis(req.body, subject, emails);
  if (!validationSample) {
    return res.status(400).json(createGptActionResponse(
      "MANUAL_PAYLOAD_REQUIRED",
      "Provide validationSample.body, or resend the Gmail email samples returned by extractor-from-subject, before persisting Custom GPT analysis.",
      {
        capabilities,
        subject,
        extractorId,
        acceptedPayloadShapes: ["validationSample", "emails"],
      },
    ));
  }

  const persisted = await persistGptAnalysisResult(
    req,
    loaded?.profile?.uid || "",
    analysis,
    subject,
    emails,
    validationSample,
  );
  const response = createPersistedGptExtractorResponse(
    persisted,
    capabilities,
    subject,
    extractorId,
    emails.length,
    "Extractor created from Custom GPT analysis.",
    "Subject added to existing extractor from Custom GPT analysis.",
  );
  return res.status(response.statusCode).json(response.body);
}
