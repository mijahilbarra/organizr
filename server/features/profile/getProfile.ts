import { Request, Response } from "express";
import { expireGmailConnectionIfNeeded } from "./expireGmailConnectionIfNeeded";
import { loadRequiredUserProfileForRequest } from "./loadRequiredUserProfileForRequest";
import { saveUserProfile } from "./saveUserProfile";
import { sanitizeUserProfile } from "./sanitizeUserProfile";

export async function getProfile(req: Request, res: Response) {
  const profileContext = await loadRequiredUserProfileForRequest(req, res);
  if (!profileContext) return;

  try {
    const { profile } = profileContext;
    const didExpireGmail = expireGmailConnectionIfNeeded(profile);

    if (didExpireGmail) {
      await saveUserProfile(profile);
    }

    res.json({ profile: sanitizeUserProfile(profile) });
  } catch (error: any) {
    console.error("Profile lookup breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to load profile." });
  }
}
