import { Request, Response } from "express";
import { Extractor } from "../../types";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { updateExtractorById } from "./updateExtractorById";

export async function handleExtractorUpdateRequest(
  req: Request,
  res: Response,
  updateExtractor: (extractor: Extractor) => void,
  errorLogLabel: string,
  notFoundMessage = "Extractor not found.",
): Promise<void> {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractor = await updateExtractorById(id, firebaseUser.uid, updateExtractor);

    if (!extractor) {
      res.status(404).json({ error: notFoundMessage });
      return;
    }

    res.json(extractor);
  } catch (error: any) {
    console.error(`${errorLogLabel} breakdown:`, error);
    res.status(500).json({ error: error.message });
  }
}
