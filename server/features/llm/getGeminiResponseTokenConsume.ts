export function getGeminiResponseTokenConsume(response: unknown): {
  requestCount: number;
  promptTokenCount: number;
  candidateTokenCount: number;
  totalTokenCount: number;
} {
  const usageMetadata = response && typeof response === "object"
    ? (response as { usageMetadata?: Record<string, unknown> }).usageMetadata
    : undefined;

  const promptTokenCount = Number(usageMetadata?.promptTokenCount || 0);
  const candidateTokenCount = Number(usageMetadata?.candidatesTokenCount || 0);
  const totalTokenCount = Number(usageMetadata?.totalTokenCount || promptTokenCount + candidateTokenCount);

  return {
    requestCount: 1,
    promptTokenCount,
    candidateTokenCount,
    totalTokenCount,
  };
}
