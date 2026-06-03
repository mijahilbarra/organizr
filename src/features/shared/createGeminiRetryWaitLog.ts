export function createGeminiRetryWaitLog(scope: string, retryNumber: number, secondsRemaining: number): string {
  return `[${scope}] Gemini may be under high demand. Retry ${retryNumber}/3 in ${secondsRemaining}s.`;
}
