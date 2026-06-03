import { GptActionCode } from "./GptActionCode";

export function createGptActionResponse<TPayload extends Record<string, unknown>>(
  code: GptActionCode,
  message: string,
  payload: TPayload,
) {
  return {
    ok: code === "READY",
    code,
    message,
    ...payload,
  };
}
