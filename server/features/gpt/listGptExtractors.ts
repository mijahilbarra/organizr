import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { listExtractorsForUser } from "../extractors/listExtractorsForUser";
import { Extractor } from "../../types";
import { createGptActionResponse } from "./createGptActionResponse";

export function createGptSafeExtractor(extractor: Extractor) {
  return {
    id: extractor.id,
    name: extractor.name,
    query: extractor.query,
    explanation: extractor.explanation,
    schemaFields: extractor.schemaFields,
    subjects: extractor.subjects.map((subject) => ({
      id: subject.id,
      value: subject.value,
      createdAt: subject.createdAt,
      lastScannedAt: subject.lastScannedAt || null,
    })),
    enabledSchedule: extractor.enabledSchedule,
    triggerCount: extractor.triggerCount,
    operationCount: extractor.operationCount,
    createdAt: extractor.createdAt,
  };
}

export async function listGptExtractors(req: Request, res: Response) {
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractors = await listExtractorsForUser(firebaseUser.uid);

    res.json(createGptActionResponse("READY", "Extractors loaded.", {
      extractors: extractors.map(createGptSafeExtractor),
      count: extractors.length,
    }));
  } catch (error: any) {
    console.error("List GPT extractors breakdown:", error);
    res.status(500).json(createGptActionResponse("EXTRACTOR_READ_FAILED", error.message || "Failed to load extractors.", {}));
  }
}
