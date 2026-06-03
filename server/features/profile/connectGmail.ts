import { Request, Response } from "express";
import { getGmailTokenExpiresAt } from "./getGmailTokenExpiresAt";
import { loadRequiredUserProfileForRequest } from "./loadRequiredUserProfileForRequest";
import { saveUserProfile } from "./saveUserProfile";
import { sanitizeUserProfile } from "./sanitizeUserProfile";

export async function connectGmail(req: Request, res: Response) {
  const profileContext = await loadRequiredUserProfileForRequest(req, res);
  const { accessToken } = req.body;
  const expiresInSeconds = Number(req.body?.expiresInSeconds || 0);

  if (!profileContext) return;

  if (!accessToken || typeof accessToken !== "string") {
    return res.status(400).json({ error: "Missing Gmail access token." });
  }

  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    return res.status(400).json({ error: "Missing Gmail token expiration." });
  }

  try {
    const { profile } = profileContext;
    const now = new Date().toISOString();

    profile.gmailConnection = {
      accessToken,
      connectedAt: now,
      expiresAt: getGmailTokenExpiresAt(expiresInSeconds),
    };
    profile.updatedAt = now;

    await saveUserProfile(profile);
    res.json({ profile: sanitizeUserProfile(profile) });
  } catch (error: any) {
    console.error("Gmail connect breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to persist Gmail connection." });
  }
}
