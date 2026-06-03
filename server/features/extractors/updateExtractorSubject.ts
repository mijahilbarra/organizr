import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { loadExtractorContextById } from "./loadExtractorContextById";
import { normalizeExtractorSubjects } from "./normalizeExtractorSubjects";
import { saveExtractor } from "./saveExtractor";
import { createGptActionResponse } from "../gpt/createGptActionResponse";

export async function updateExtractorSubject(req: Request, res: Response) {
  const { id, subjectId } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  const subject = String(req.body.subject || req.body.value || "").trim();
  const scriptCode = req.body?.scriptCode === undefined ? undefined : String(req.body.scriptCode || "").trim();

  if (!subject) {
    return res.status(400).json(createGptActionResponse("SUBJECT_REQUIRED", "Subject is required.", {
      extractorId: id,
      subjectId,
    }));
  }

  try {
    const extractorContext = await loadExtractorContextById(id, firebaseUser.uid);
    if (!extractorContext) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Extractor not found.", {
        extractorId: id,
        subjectId,
      }));
    }

    const extractor = normalizeExtractorSubjects(extractorContext.extractor);
    const existingSubject = extractor.subjects.find((entry) => entry.id === subjectId);

    if (!existingSubject) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Subject not found.", {
        extractorId: id,
        subjectId,
      }));
    }

    existingSubject.value = subject;

    if (scriptCode !== undefined) {
      existingSubject.scriptCode = scriptCode;
    }

    if (!extractor.query) {
      extractor.query = subject;
    }

    await saveExtractor(extractor);

    return res.json(createGptActionResponse("READY", "Subject updated.", {
      extractorId: id,
      subjectId,
      extractor,
      subject: existingSubject,
    }));
  } catch (error: any) {
    console.error("Update extractor subject breakdown:", error);
    return res.status(500).json(createGptActionResponse("EXTRACTOR_UPDATE_FAILED", error.message || "Failed to update extractor subject.", {
      extractorId: id,
      subjectId,
    }));
  }
}
