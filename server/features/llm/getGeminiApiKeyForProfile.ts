import { UserProfile } from "../../types";

export function getGeminiApiKeyForProfile(profile: UserProfile): string | undefined {
  return profile.llmSettings.geminiApiKey || process.env.GEMINI_API_KEY;
}
