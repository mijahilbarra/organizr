import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { loadExtractorContextById } from "../extractors/loadExtractorContextById";
import { listOperationsForExtractor } from "./listOperationsForExtractor";

export async function listExtractorOperations(req: Request, res: Response) {
  const { id } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractorContext = await loadExtractorContextById(id, firebaseUser.uid);
    if (!extractorContext) {
      return res.status(404).json({ error: "Extractor not found." });
    }

    const limit = Number(req.query.limit || 20);
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const page = await listOperationsForExtractor(id, firebaseUser.uid, limit, cursor);

    return res.json(page);
  } catch (error: any) {
    console.error("List extractor operations breakdown:", error);
    return res.status(500).json({ error: error.message || "Failed to list extractor operations." });
  }
}
