import { Request, Response } from "express";
import { loadRequiredUserProfileForRequest } from "./loadRequiredUserProfileForRequest";
import { saveUserProfile } from "./saveUserProfile";
import { sanitizeUserProfile } from "./sanitizeUserProfile";
import { updateUserLlmSettingsFromRequest } from "./updateUserLlmSettingsFromRequest";

export async function updateProfile(req: Request, res: Response) {
  const { displayName, photoURL } = req.body;
  const profileContext = await loadRequiredUserProfileForRequest(req, res);
  if (!profileContext) return;

  try {
    const { profile } = profileContext;

    if (typeof displayName === "string") {
      profile.displayName = displayName.trim();
    }

    if (typeof photoURL === "string") {
      profile.photoURL = photoURL.trim();
    }

    updateUserLlmSettingsFromRequest(profile, req.body);

    profile.updatedAt = new Date().toISOString();
    await saveUserProfile(profile);

    res.json({ profile: sanitizeUserProfile(profile) });
  } catch (error: any) {
    console.error("Profile update breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to update profile." });
  }
}
