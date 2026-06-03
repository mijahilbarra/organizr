export function normalizeOAuthRedirectUri(redirectUri: string): string {
  const trimmed = String(redirectUri || "").trim();
  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return trimmed;
  }
}
