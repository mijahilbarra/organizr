import { LlmProviderError } from "./LlmProviderError";

export function createLlmProviderErrorResponse(error: LlmProviderError) {
  return {
    error: error.message,
    actionCode: error.actionCode,
    provider: error.provider,
    actionUrl: error.actionUrl,
  };
}
