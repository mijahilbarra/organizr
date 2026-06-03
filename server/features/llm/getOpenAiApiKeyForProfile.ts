import { UserProfile } from "../../types";
import { getServerOpenAiApiKey } from "./getServerOpenAiApiKey";

export function getOpenAiApiKeyForProfile(profile: UserProfile): string | undefined {
  return profile.llmSettings.openAiApiKey || getServerOpenAiApiKey();
}
