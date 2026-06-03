export async function waitForGeminiRetryCountdown(
  seconds: number,
  onLog: (message: string) => void,
): Promise<void> {
  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    onLog(`Gemini high demand retry starts in ${remaining}s.`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
