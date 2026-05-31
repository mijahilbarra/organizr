/**
 * Decodes base64url content to UTF-8 text string safely.
 */
export function decodeBase64(data: string): string {
  if (!data) return "";
  const standardBase64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return Buffer.from(standardBase64, 'base64').toString('utf-8');
  } catch (err) {
    return "Failed to decode content.";
  }
}
