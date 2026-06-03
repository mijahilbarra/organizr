import { ValidationSample } from "../../../src/types";

export function createValidationSample(
  input: unknown,
  fallbackSubject: string,
): ValidationSample | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const source = input as {
    body?: unknown;
    subject?: unknown;
    from?: unknown;
  };
  const body = String(source.body || "");
  if (!body.trim()) {
    return null;
  }

  return {
    body,
    subject: typeof source.subject === "string" && source.subject.trim()
      ? source.subject.trim()
      : fallbackSubject,
    from: typeof source.from === "string" ? source.from : "",
  };
}
