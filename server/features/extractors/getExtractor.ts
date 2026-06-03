import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { getExtractorByIdForUser } from "./getExtractorByIdForUser";

export async function getExtractor(req: Request, res: Response) {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractor = await getExtractorByIdForUser(id, firebaseUser.uid);

    if (!extractor) {
      return res.status(404).json({ error: "Extractor not found." });
    }

    res.json({ extractor });
  } catch (error: any) {
    console.error("Get extractor breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to load extractor." });
  }
}
