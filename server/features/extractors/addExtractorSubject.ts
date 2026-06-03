import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { createExtractorSubject } from "./createExtractorSubject";
import { createGptActionResponse } from "../gpt/createGptActionResponse";
import { createValidationSample } from "./createValidationSample";
import { createValidatedExtractorSubject } from "./createValidatedExtractorSubject";
import { loadRequiredNormalizedExtractorForSubjectMutation } from "./loadRequiredNormalizedExtractorForSubjectMutation";
import { saveExtractorWithSubjectSamples } from "./saveExtractorWithSubjectSamples";

export async function addExtractorSubject(req: Request, res: Response) {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  const subject = String(req.body.subject || req.body.value || "").trim();
  const scriptCode = String(req.body.scriptCode || "").trim();
  const validationSample = createValidationSample(req.body?.validationSample, subject);

  if (!firebaseUser) return;

  if (!subject) {
    return res.status(400).json(createGptActionResponse(
      "SUBJECT_REQUIRED",
      "Subject is required.",
      {},
    ));
  }

  if (!scriptCode) {
    return res.status(400).json(createGptActionResponse(
      "ANALYSIS_FAILED",
      "scriptCode is required.",
      { extractorId: id, subject },
    ));
  }

  if (!validationSample) {
    return res.status(400).json(createGptActionResponse(
      "MANUAL_PAYLOAD_REQUIRED",
      "validationSample.body is required to validate a new subject parser before saving.",
      { extractorId: id, subject },
    ));
  }

  try {
    const extractor = await loadRequiredNormalizedExtractorForSubjectMutation(
      res,
      id,
      firebaseUser.uid,
      { extractorId: id, subject },
    );
    if (!extractor) {
      return;
    }

    const alreadyRegistered = extractor.subjects.some(
      (registeredSubject) => registeredSubject.value.toLowerCase() === subject.toLowerCase(),
    );

    if (alreadyRegistered) {
      return res.status(409).json(createGptActionResponse(
        "SUBJECT_ALREADY_EXISTS",
        "Subject already exists on this extractor.",
        { extractorId: id, subject },
      ));
    }

    const validatedSubject = createValidatedExtractorSubject({
      schemaFields: extractor.schemaFields,
      subject,
      scriptCode,
      validationSample,
    }).subject;

    extractor.subjects.push(createExtractorSubject(
      validatedSubject.value,
      validatedSubject.scriptCode,
      validatedSubject.validationSample,
      validatedSubject.validationResult,
    ));

    if (!extractor.query) {
      extractor.query = extractor.subjects[0]?.value || subject;
    }

    await saveExtractorWithSubjectSamples(extractor);

    return res.json(createGptActionResponse("READY", "Subject registered and attached to the extractor.", {
      extractor,
      extractorId: id,
      subject,
      newCount: 0,
      scannedCount: 0,
      mode: "appended_only",
      schemaChanged: false,
    }));
  } catch (error: any) {
    const message = error.message || "Failed to add extractor subject.";
    console.error("Add extractor subject breakdown:", error);
    return res.status(500).json(createGptActionResponse(
      "UNEXPECTED_ERROR",
      message,
      { extractorId: id, subject },
    ));
  }
}
