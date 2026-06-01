export async function revokeGoogleAccessToken(accessToken: string): Promise<void> {
  try {
    const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(revokeUrl, { method: "POST" });

    if (!response.ok) {
      const details = await response.text();
      console.warn(`Google token revoke returned HTTP ${response.status}: ${details}`);
    }
  } catch (error) {
    console.warn("Google token revoke request failed:", error);
  }
}
