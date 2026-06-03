import { Request, Response } from "express";
import { handleExtractorUpdateRequest } from "./handleExtractorUpdateRequest";

export async function updateExtractor(req: Request, res: Response) {
  const name = req.body?.name;
  const query = req.body?.query;
  const webhookUrl = req.body?.webhookUrl;
  const enabledSchedule = req.body?.enabledSchedule;

  await handleExtractorUpdateRequest(
    req,
    res,
    (extractor) => {
      if (typeof name === "string") extractor.name = name.trim() || extractor.name;
      if (typeof query === "string") extractor.query = query.trim() || extractor.query;
      if (typeof webhookUrl === "string") extractor.webhookUrl = webhookUrl.trim();
      if (enabledSchedule !== undefined) extractor.enabledSchedule = Boolean(enabledSchedule);
    },
    "Update extractor",
  );
}
