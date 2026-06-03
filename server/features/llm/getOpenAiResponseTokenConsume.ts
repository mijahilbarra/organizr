export function getOpenAiResponseTokenConsume(response: unknown): {
  requestCount: number;
  promptTokenCount: number;
  candidateTokenCount: number;
  totalTokenCount: number;
} {
  const usage = response && typeof response === "object"
    ? (response as { usage?: Record<string, unknown> }).usage
    : undefined;

  const promptTokenCount = Number(usage?.input_tokens || 0);
  const candidateTokenCount = Number(usage?.output_tokens || 0);
  const totalTokenCount = Number(usage?.total_tokens || promptTokenCount + candidateTokenCount);

  return {
    requestCount: 1,
    promptTokenCount,
    candidateTokenCount,
    totalTokenCount,
  };
}
