import { GoogleGenAI } from "@google/genai";
import { LlmProvider, UserProfile } from "../../types";
import { normalizeLlmProvider } from "../profile/normalizeLlmProvider";
import { createGeminiClient } from "./createGeminiClient";
import { getGeminiApiKeyForProfile } from "./getGeminiApiKeyForProfile";
import { getOpenAiApiKeyForProfile } from "./getOpenAiApiKeyForProfile";
import { LlmProviderError } from "./LlmProviderError";

export type ResolvedLlmProvider = {
  provider: Exclude<LlmProvider, "auto">;
  providerLabel: string;
  geminiClient?: GoogleGenAI;
  openAiApiKey?: string;
};

export function resolveLlmProvider(profile: UserProfile, requestedProvider: unknown): ResolvedLlmProvider {
  const provider = normalizeLlmProvider(requestedProvider || profile.llmSettings.defaultProvider);
  const geminiApiKey = getGeminiApiKeyForProfile(profile);
  const openAiApiKey = getOpenAiApiKeyForProfile(profile);

  if (provider === "gemini") {
    if (!geminiApiKey) {
      throw new LlmProviderError("Gemini is not configured for this user.", "CONFIGURE_GEMINI_API_KEY", "gemini");
    }

    return {
      provider: "gemini",
      providerLabel: "Gemini",
      geminiClient: createGeminiClient(geminiApiKey),
    };
  }

  if (provider === "openai") {
    if (!openAiApiKey) {
      throw new LlmProviderError("OpenAI is not configured for this user.", "CONFIGURE_OPENAI_API_KEY", "openai");
    }

    return {
      provider: "openai",
      providerLabel: "Chat GPT",
      openAiApiKey,
    };
  }

  if (geminiApiKey) {
    return {
      provider: "gemini",
      providerLabel: "Gemini",
      geminiClient: createGeminiClient(geminiApiKey),
    };
  }

  if (openAiApiKey) {
    return {
      provider: "openai",
      providerLabel: "Chat GPT",
      openAiApiKey,
    };
  }

  throw new LlmProviderError("No LLM provider is configured for this user.", "CONFIGURE_LLM_PROVIDER");
}
