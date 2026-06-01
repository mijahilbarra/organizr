import { Request, Response } from "express";
import { handleExtractorUpdateRequest } from "./handleExtractorUpdateRequest";

/**
 * Handles updating of the outbound webhook end-point target for parsed records forwarding.
 */
export async function updateWebhook(req: Request, res: Response) {
  const { webhookUrl } = req.body;
  await handleExtractorUpdateRequest(
    req,
    res,
    (targetExtractor) => {
      targetExtractor.webhookUrl = webhookUrl || "";
    },
    "Update webhook",
    "Extractor not found",
  );
}
