import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { loadExtractorContextById } from "./loadExtractorContextById";
import { normalizeExtractorSubjects } from "./normalizeExtractorSubjects";
import { createGptActionResponse } from "../gpt/createGptActionResponse";

export async function getExtractorSubject(req: Request, res: Response) {
  const { id, subjectId } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractorContext = await loadExtractorContextById(id, firebaseUser.uid);
    if (!extractorContext) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Extractor not found.", {
        extractorId: id,
        subjectId,
      }));
    }

    const extractor = normalizeExtractorSubjects(extractorContext.extractor);
    const subject = extractor.subjects.find((entry) => entry.id === subjectId);

    if (!subject) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Subject not found.", {
        extractorId: id,
        subjectId,
      }));
    }

    res.json(createGptActionResponse("READY", "Extractor subject loaded.", {
      extractorId: id,
      subjectId,
      subject,
    }));
  } catch (error: any) {
    console.error("Get extractor subject breakdown:", error);
    res.status(500).json(createGptActionResponse("EXTRACTOR_READ_FAILED", error.message || "Failed to load subject.", {
      extractorId: id,
      subjectId,
    }));
  }
}
