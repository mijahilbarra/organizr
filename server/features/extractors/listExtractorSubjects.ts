import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { getExtractorSubjects } from "./getExtractorSubjects";
import { loadExtractorContextById } from "./loadExtractorContextById";
import { createGptActionResponse } from "../gpt/createGptActionResponse";

export async function listExtractorSubjects(req: Request, res: Response) {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractorContext = await loadExtractorContextById(id, firebaseUser.uid);

    if (!extractorContext) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Extractor not found.", { extractorId: id }));
    }

    res.json(createGptActionResponse("READY", "Extractor subjects loaded.", {
      extractorId: id,
      subjects: getExtractorSubjects(extractorContext.extractor),
    }));
  } catch (error: any) {
    console.error("List extractor subjects breakdown:", error);
    res.status(500).json(createGptActionResponse("EXTRACTOR_READ_FAILED", error.message || "Failed to list extractor subjects.", { extractorId: id }));
  }
}
