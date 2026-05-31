import { decodeBase64 } from "./decodeBase64";

/**
 * Traverse Gmail MIME parts structure recursively to resolve body text.
 */
export function getEmailBody(payload: any): string {
  if (!payload) return "";
  if (payload.body && payload.body.data && (!payload.parts || payload.parts.length === 0)) {
    return decodeBase64(payload.body.data);
  }

  let plainText = "";
  let htmlText = "";

  function traverse(parts: any[]) {
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body && part.body.data) {
        plainText += decodeBase64(part.body.data);
      } else if (part.mimeType === "text/html" && part.body && part.body.data) {
        htmlText += decodeBase64(part.body.data);
      } else if (part.parts) {
        traverse(part.parts);
      }
    }
  }

  if (payload.parts) {
    traverse(payload.parts);
  }

  return plainText || htmlText || "";
}
