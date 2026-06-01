import { ExtractionRecord } from "../../types";
import { sendToWebhook } from "./sendToWebhook";

export function sendExtractorRecordWebhooks(
  webhookUrl: string,
  event: string,
  extractorId: string,
  extractorName: string,
  records: ExtractionRecord[],
): void {
  if (!webhookUrl || records.length === 0) {
    return;
  }

  records.forEach((record) => {
    sendToWebhook(webhookUrl, {
      event,
      extractorId,
      extractorName,
      record,
    }).catch((err) => console.error("Webhook deferred dispatch crashed:", err));
  });
}
