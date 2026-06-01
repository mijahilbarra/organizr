import { Request, Response } from "express";
import { loadRequiredUserProfileForRequest } from "./loadRequiredUserProfileForRequest";
import { revokeGoogleAccessToken } from "./revokeGoogleAccessToken";
import { saveUserProfile } from "./saveUserProfile";
import { sanitizeUserProfile } from "./sanitizeUserProfile";

export async function revokeGmail(req: Request, res: Response) {
  const profileContext = await loadRequiredUserProfileForRequest(req, res);
  if (!profileContext) return;

  try {
    const { profile } = profileContext;
    const accessToken = profile.gmailConnection?.accessToken;

    if (accessToken) {
      await revokeGoogleAccessToken(accessToken);
    }

    profile.gmailConnection = null;
    profile.updatedAt = new Date().toISOString();

    await saveUserProfile(profile);
    res.json({ profile: sanitizeUserProfile(profile) });
  } catch (error: any) {
    console.error("Gmail revoke breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to revoke Gmail connection." });
  }
}
