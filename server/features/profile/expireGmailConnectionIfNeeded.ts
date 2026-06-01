import { UserProfile } from "../../types";
import { isGmailConnectionActive } from "./isGmailConnectionActive";

export function expireGmailConnectionIfNeeded(profile: UserProfile): boolean {
  if (!profile.gmailConnection || profile.gmailConnection.revokedAt) {
    return false;
  }

  if (isGmailConnectionActive(profile.gmailConnection)) {
    return false;
  }

  profile.gmailConnection = null;
  profile.updatedAt = new Date().toISOString();
  return true;
}
