import { Request, Response } from "express";
import { readDb } from "../../db/readDb";

/**
 * Lists all active and saved email extractors with their parsed data records history.
 */
export async function listExtractors(req: Request, res: Response) {
  try {
    const dbObj = await readDb();
    res.json({ extractors: dbObj.extractors });
  } catch (error: any) {
    console.error("Listing extractors breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to load extractors database." });
  }
}
