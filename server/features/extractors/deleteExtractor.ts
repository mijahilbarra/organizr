import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { deleteExtractorById } from "./deleteExtractorById";

export async function deleteExtractor(req: Request, res: Response) {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const wasDeleted = await deleteExtractorById(id, firebaseUser.uid);

    if (!wasDeleted) {
      res.status(404).json({ error: "Extractor not found." });
      return;
    }

    res.json({ id, deleted: true });
  } catch (error: any) {
    console.error("Delete extractor breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to delete extractor." });
  }
}
