import { UserProfile } from "../../types";
import { createUserCapabilities } from "./createUserCapabilities";

export function sanitizeUserProfile(profile: UserProfile): Omit<UserProfile, "gmailConnection" | "llmSettings"> & {
  gmailConnection: null | {
    connectedAt: string;
    expiresAt: string;
    revokedAt?: string;
  };
  llmSettings: {
    defaultProvider: UserProfile["llmSettings"]["defaultProvider"];
    hasGeminiApiKey: boolean;
    hasOpenAiApiKey: boolean;
  };
  capabilities: ReturnType<typeof createUserCapabilities>;
} {
  return {
    ...profile,
    llmConsumeByMonth: profile.llmConsumeByMonth || {},
    llmSettings: {
      defaultProvider: profile.llmSettings.defaultProvider,
      hasGeminiApiKey: !!profile.llmSettings.geminiApiKey,
      hasOpenAiApiKey: !!profile.llmSettings.openAiApiKey,
    },
    capabilities: createUserCapabilities(profile),
    gmailConnection: profile.gmailConnection
      ? {
          connectedAt: profile.gmailConnection.connectedAt,
          expiresAt: profile.gmailConnection.expiresAt,
          revokedAt: profile.gmailConnection.revokedAt,
        }
      : null,
  };
}
