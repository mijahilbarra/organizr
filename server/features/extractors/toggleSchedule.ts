import { Request, Response } from "express";
import { updateExtractorById } from "./updateExtractorById";

/**
 * Toggles whether an extractor script has scheduling active.
 */
export async function toggleSchedule(req: Request, res: Response) {
  const { id } = req.params;
  const { enabledSchedule } = req.body;

  try {
    const extractor = await updateExtractorById(id, (targetExtractor) => {
      targetExtractor.enabledSchedule = !!enabledSchedule;
    });

    if (!extractor) {
      return res.status(404).json({ error: "Extractor not found." });
    }

    res.json(extractor);
  } catch (error: any) {
    console.error("Toggle schedule breakdown:", error);
    res.status(500).json({ error: error.message });
  }
}
