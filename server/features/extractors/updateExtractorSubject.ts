import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { createGptActionResponse } from "../gpt/createGptActionResponse";
import { createValidationSample } from "./createValidationSample";
import { createValidatedExtractorSubject } from "./createValidatedExtractorSubject";
import { loadRequiredNormalizedExtractorForSubjectMutation } from "./loadRequiredNormalizedExtractorForSubjectMutation";
import { saveExtractorWithSubjectSamples } from "./saveExtractorWithSubjectSamples";

export async function updateExtractorSubject(req: Request, res: Response) {
  const { id, subjectId } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  const subject = String(req.body.subject || req.body.value || "").trim();
  const scriptCode = req.body?.scriptCode === undefined ? undefined : String(req.body.scriptCode || "").trim();
  const validationSample = createValidationSample(req.body?.validationSample, subject);

  if (!subject) {
    return res.status(400).json(createGptActionResponse("SUBJECT_REQUIRED", "Subject is required.", {
      extractorId: id,
      subjectId,
    }));
  }

  try {
    const extractor = await loadRequiredNormalizedExtractorForSubjectMutation(
      res,
      id,
      firebaseUser.uid,
      { extractorId: id, subjectId },
    );
    if (!extractor) {
      return;
    }
    const existingSubject = extractor.subjects.find((entry) => entry.id === subjectId);

    if (!existingSubject) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Subject not found.", {
        extractorId: id,
        subjectId,
      }));
    }

    const nextScriptCode = scriptCode !== undefined ? scriptCode : existingSubject.scriptCode || "";
    const nextValidationSample = validationSample || createValidationSample(existingSubject.validationSample, subject);

    if (!nextScriptCode) {
      return res.status(400).json(createGptActionResponse("ANALYSIS_FAILED", "scriptCode is required.", {
        extractorId: id,
        subjectId,
      }));
    }

    if (!nextValidationSample) {
      return res.status(400).json(createGptActionResponse("MANUAL_PAYLOAD_REQUIRED", "validationSample.body is required to validate the subject parser before saving.", {
        extractorId: id,
        subjectId,
      }));
    }

    const validatedSubject = createValidatedExtractorSubject({
      schemaFields: extractor.schemaFields,
      subject,
      scriptCode: nextScriptCode,
      validationSample: nextValidationSample,
      subjectId: existingSubject.id,
      createdAt: existingSubject.createdAt,
      lastScannedAt: existingSubject.lastScannedAt,
    }).subject;

    const existingSubjectIndex = extractor.subjects.findIndex((entry) => entry.id === subjectId);
    extractor.subjects[existingSubjectIndex] = validatedSubject;

    if (!extractor.query) {
      extractor.query = subject;
    }

    await saveExtractorWithSubjectSamples(extractor);

    return res.json(createGptActionResponse("READY", "Subject updated.", {
      extractorId: id,
      subjectId,
      extractor,
      subject: validatedSubject,
    }));
  } catch (error: any) {
    console.error("Update extractor subject breakdown:", error);
    return res.status(500).json(createGptActionResponse("EXTRACTOR_UPDATE_FAILED", error.message || "Failed to update extractor subject.", {
      extractorId: id,
      subjectId,
    }));
  }
}
