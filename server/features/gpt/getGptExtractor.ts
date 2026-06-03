import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { getExtractorByIdForUser } from "../extractors/getExtractorByIdForUser";
import { createGptSafeExtractor } from "./listGptExtractors";
import { createGptActionResponse } from "./createGptActionResponse";

export async function getGptExtractor(req: Request, res: Response) {
  const { extractorId } = req.params;
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractor = await getExtractorByIdForUser(extractorId, firebaseUser.uid);

    if (!extractor) {
      return res.status(404).json(createGptActionResponse("EXTRACTOR_NOT_FOUND", "Extractor not found.", {
        extractorId,
      }));
    }

    res.json(createGptActionResponse("READY", "Extractor loaded.", {
      extractorId,
      extractor: createGptSafeExtractor(extractor),
    }));
  } catch (error: any) {
    console.error("Get GPT extractor breakdown:", error);
    res.status(500).json(createGptActionResponse("EXTRACTOR_READ_FAILED", error.message || "Failed to load extractor.", {
      extractorId,
    }));
  }
}
