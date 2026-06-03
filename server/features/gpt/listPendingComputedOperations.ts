import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { loadExtractorContextById } from "../extractors/loadExtractorContextById";
import { listPendingComputedOperations as listPendingComputedOperationsForExtractor } from "../computed/listPendingComputedOperations";
import { createGptActionResponse } from "./createGptActionResponse";

export async function listPendingComputedOperations(req: Request, res: Response) {
  const { extractorId } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractorContext = await loadExtractorContextById(extractorId, firebaseUser.uid);
    if (!extractorContext) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Extractor not found.", {
        extractorId,
        mode: "extractor-scope",
      }));
    }

    const pendingOperations = await listPendingComputedOperationsForExtractor(extractorId, firebaseUser.uid);
    return res.json(createGptActionResponse("READY", "Pending computed operations loaded.", {
      extractorId,
      mode: "extractor-scope",
      pendingCount: pendingOperations.length,
      operations: pendingOperations,
    }));
  } catch (error: any) {
    console.error("List pending computed operations breakdown:", error);
    return res.status(500).json(createGptActionResponse("UNEXPECTED_ERROR", error.message || "Failed to list pending computed operations.", {
      extractorId,
      mode: "extractor-scope",
    }));
  }
}
