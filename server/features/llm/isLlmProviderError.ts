import { LlmProviderError } from "./LlmProviderError";

export function isLlmProviderError(error: unknown): error is LlmProviderError {
  return error instanceof LlmProviderError;
}
