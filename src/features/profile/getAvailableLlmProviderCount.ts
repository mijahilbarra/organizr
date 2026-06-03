import { UserProfile } from "../../types";

export function getAvailableLlmProviderCount(profile: UserProfile | null) {
  const providers = profile?.capabilities?.llm?.providers;

  return [providers?.gemini.available, providers?.openai.available]
    .filter(Boolean)
    .length;
}
