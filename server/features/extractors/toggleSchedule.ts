import { Request, Response } from "express";
import { handleExtractorUpdateRequest } from "./handleExtractorUpdateRequest";

/**
 * Toggles whether an extractor script has scheduling active.
 */
export async function toggleSchedule(req: Request, res: Response) {
  const { enabledSchedule } = req.body;
  await handleExtractorUpdateRequest(
    req,
    res,
    (targetExtractor) => {
      targetExtractor.enabledSchedule = !!enabledSchedule;
    },
    "Toggle schedule",
  );
}
