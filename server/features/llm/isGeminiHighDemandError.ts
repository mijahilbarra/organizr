export function isGeminiHighDemandError(error: unknown): boolean {
  const status = error && typeof error === "object"
    ? (error as { status?: string; code?: number }).status
    : undefined;
  const code = error && typeof error === "object"
    ? (error as { code?: number }).code
    : undefined;
  const message = error instanceof Error ? error.message : JSON.stringify(error);

  return code === 503
    || status === "UNAVAILABLE"
    || message.includes("\"code\":503")
    || message.includes("\"status\":\"UNAVAILABLE\"")
    || message.includes("This model is currently experiencing high demand");
}
