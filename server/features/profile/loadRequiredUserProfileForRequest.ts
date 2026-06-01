import { Request, Response } from "express";
import { UserProfile } from "../../types";
import { loadUserProfileForRequest } from "./loadUserProfileForRequest";

export async function loadRequiredUserProfileForRequest(
  req: Request,
  res: Response,
): Promise<{
  profile: UserProfile;
} | null> {
  const profileContext = await loadUserProfileForRequest(req);

  if (!profileContext) {
    res.status(401).json({ error: "Missing Firebase user context." });
    return null;
  }

  return profileContext;
}
