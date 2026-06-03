import { UserLlmSettings } from "../../types";
import { normalizeLlmProvider } from "./normalizeLlmProvider";

export function normalizeUserLlmSettings(value: unknown): UserLlmSettings {
  const source = value && typeof value === "object" ? value as Partial<UserLlmSettings> : {};

  return {
    defaultProvider: normalizeLlmProvider(source.defaultProvider),
    geminiApiKey: typeof source.geminiApiKey === "string" ? source.geminiApiKey : undefined,
    openAiApiKey: typeof source.openAiApiKey === "string" ? source.openAiApiKey : undefined,
  };
}
