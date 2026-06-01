import { UserProfile } from "../../types";

export function sanitizeUserProfile(profile: UserProfile): Omit<UserProfile, "gmailConnection"> & {
  gmailConnection: null | {
    connectedAt: string;
    expiresAt: string;
    revokedAt?: string;
  };
} {
  return {
    ...profile,
    gmailConnection: profile.gmailConnection
      ? {
          connectedAt: profile.gmailConnection.connectedAt,
          expiresAt: profile.gmailConnection.expiresAt,
          revokedAt: profile.gmailConnection.revokedAt,
        }
      : null,
  };
}
