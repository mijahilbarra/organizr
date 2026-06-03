import { GoogleGenAI } from "@google/genai";

export function createGeminiClient(apiKey = process.env.GEMINI_API_KEY): GoogleGenAI {
  const geminiKey = apiKey;

  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  return new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: {
      headers: {
        "User-Agent": "organizr",
      },
    },
  });
}
