export function getServerOpenAiApiKey(): string | undefined {
  return process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY;
}
