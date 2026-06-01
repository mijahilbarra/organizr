import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { getExtractorSubjects } from "./getExtractorSubjects";
import { loadExtractorContextById } from "./loadExtractorContextById";

export async function listExtractorSubjects(req: Request, res: Response) {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractorContext = await loadExtractorContextById(id, firebaseUser.uid);

    if (!extractorContext) {
      return res.status(404).json({ error: "Extractor not found." });
    }

    res.json({ subjects: getExtractorSubjects(extractorContext.extractor) });
  } catch (error: any) {
    console.error("List extractor subjects breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to list extractor subjects." });
  }
}
