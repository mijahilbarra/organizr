import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { createExtractorSubject } from "./createExtractorSubject";
import { loadExtractorContextById } from "./loadExtractorContextById";
import { normalizeExtractorSubjects } from "./normalizeExtractorSubjects";
import { saveExtractor } from "./saveExtractor";
import { createGptActionResponse } from "../gpt/createGptActionResponse";

export async function addExtractorSubject(req: Request, res: Response) {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  const subject = String(req.body.subject || req.body.value || "").trim();
  const scriptCode = String(req.body.scriptCode || "").trim();

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

  try {
    const extractorContext = await loadExtractorContextById(id, firebaseUser.uid);

    if (!extractorContext) {
      return res.status(404).json(createGptActionResponse(
        "EXTRACTOR_NOT_FOUND",
        "Extractor not found.",
        { extractorId: id, subject },
      ));
    }

    const extractor = normalizeExtractorSubjects(extractorContext.extractor);

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

    extractor.subjects.push(createExtractorSubject(subject, scriptCode));

    if (!extractor.query) {
      extractor.query = extractor.subjects[0]?.value || subject;
    }

    await saveExtractor(extractor);

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
