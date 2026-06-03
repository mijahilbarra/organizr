import { UserProfile } from "../../types";

export const getGmailConnectionStatus = (profile: UserProfile | null) => {
  const expiresAt = profile?.gmailConnection?.expiresAt || "";
  const expiresAtTime = expiresAt ? new Date(expiresAt).getTime() : 0;
  const isExpired = !!expiresAt && expiresAtTime <= Date.now();
  const isActive = !!profile?.gmailConnection && !isExpired;

  return {
    expiresAt,
    expiresAtLabel: expiresAt ? new Date(expiresAt).toLocaleString() : "",
    isActive,
    isExpired,
  };
};
