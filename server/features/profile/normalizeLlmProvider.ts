import { LlmProvider } from "../../types";

export function normalizeLlmProvider(value: unknown): LlmProvider {
  return value === "gemini" || value === "openai" || value === "auto" ? value : "auto";
}
