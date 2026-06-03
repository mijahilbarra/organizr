import { UserProfile } from "../../types";
import { normalizeLlmProvider } from "./normalizeLlmProvider";

export function updateUserLlmSettingsFromRequest(profile: UserProfile, body: any): boolean {
  const llmSettings = body?.llmSettings;

  if (!llmSettings || typeof llmSettings !== "object") {
    return false;
  }

  if (llmSettings.defaultProvider !== undefined) {
    profile.llmSettings.defaultProvider = normalizeLlmProvider(llmSettings.defaultProvider);
  }

  if (typeof llmSettings.geminiApiKey === "string") {
    const geminiApiKey = llmSettings.geminiApiKey.trim();
    if (geminiApiKey) {
      profile.llmSettings.geminiApiKey = geminiApiKey;
    }
  }

  if (typeof llmSettings.openAiApiKey === "string") {
    const openAiApiKey = llmSettings.openAiApiKey.trim();
    if (openAiApiKey) {
      profile.llmSettings.openAiApiKey = openAiApiKey;
    }
  }

  return true;
}
