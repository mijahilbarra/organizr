import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { listExtractorsForUser } from "./listExtractorsForUser";

/**
 * Lists all active and saved email extractors with their parsed data records history.
 */
export async function listExtractors(req: Request, res: Response) {
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  try {
    const extractors = await listExtractorsForUser(firebaseUser.uid);
    res.json({ extractors });
  } catch (error: any) {
    console.error("Listing extractors breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to load extractors database." });
  }
}
