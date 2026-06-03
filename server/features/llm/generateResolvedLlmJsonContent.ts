import { UserProfile } from "../../types";
import { generateGeminiJsonContent } from "./generateGeminiJsonContent";
import { generateOpenAiJsonContent } from "./generateOpenAiJsonContent";
import { resolveLlmProvider } from "./resolveLlmProvider";

export async function generateResolvedLlmJsonContent(
  profile: UserProfile,
  requestedProvider: unknown,
  contents: string,
  responseSchema: Record<string, any>,
  onLog: (message: string) => void = console.log,
): Promise<{ text: string; provider: "gemini" | "openai"; providerLabel: string }> {
  const resolved = resolveLlmProvider(profile, requestedProvider);

  const response = resolved.provider === "openai"
    ? await generateOpenAiJsonContent(profile.uid, contents, responseSchema, onLog, resolved.openAiApiKey)
    : await generateGeminiJsonContent(profile.uid, resolved.geminiClient!, contents, responseSchema, onLog);

  return {
    text: response.text || "{}",
    provider: resolved.provider,
    providerLabel: resolved.providerLabel,
  };
}
