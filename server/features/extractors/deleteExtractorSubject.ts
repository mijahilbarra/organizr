import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { loadExtractorContextById } from "./loadExtractorContextById";
import { normalizeExtractorSubjects } from "./normalizeExtractorSubjects";
import { saveExtractor } from "./saveExtractor";
import { createGptActionResponse } from "../gpt/createGptActionResponse";

export async function deleteExtractorSubject(req: Request, res: Response) {
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
    const initialCount = extractor.subjects.length;
    extractor.subjects = extractor.subjects.filter((subject) => subject.id !== subjectId);

    if (extractor.subjects.length === initialCount) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Subject not found.", {
        extractorId: id,
        subjectId,
      }));
    }

    if (extractor.query && !extractor.subjects.some((subject) => subject.value === extractor.query)) {
      extractor.query = extractor.subjects[0]?.value || "";
    }

    await saveExtractor(extractor);

    return res.json(createGptActionResponse("READY", "Subject deleted.", {
      extractorId: id,
      extractor,
      deletedSubjectId: subjectId,
    }));
  } catch (error: any) {
    console.error("Delete extractor subject breakdown:", error);
    return res.status(500).json(createGptActionResponse("EXTRACTOR_UPDATE_FAILED", error.message || "Failed to delete extractor subject.", {
      extractorId: id,
      subjectId,
    }));
  }
}
