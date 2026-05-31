import { Request, Response } from "express";
import { updateExtractorById } from "./updateExtractorById";

/**
 * Handles updating of the outbound webhook end-point target for parsed records forwarding.
 */
export async function updateWebhook(req: Request, res: Response) {
  const { id } = req.params;
  const { webhookUrl } = req.body;

  try {
    const extractor = await updateExtractorById(id, (targetExtractor) => {
      targetExtractor.webhookUrl = webhookUrl || "";
    });

    if (!extractor) {
      return res.status(404).json({ error: "Extractor not found" });
    }

    res.json(extractor);
  } catch (error: any) {
    console.error("Update webhook breakdown:", error);
    res.status(500).json({ error: error.message });
  }
}
