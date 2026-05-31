/**
 * Helper to dispatch extracted JSON data to a configured external third-party webhook.
 */
export async function sendToWebhook(webhookUrl: string, payload: any): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.trim().startsWith("http")) {
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Extractor-Origin": "Gmail-Schema-Extractor",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`Webhook failed with status ${res.status}: ${await res.text()}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed sending payload to third-party webhook:", error);
    return false;
  }
}
