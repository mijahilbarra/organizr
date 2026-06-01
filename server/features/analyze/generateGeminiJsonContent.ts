import { GoogleGenAI } from "@google/genai";

export async function generateGeminiJsonContent(
  ai: GoogleGenAI,
  contents: string,
  responseSchema: Record<string, any>,
) {
  return ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });
}
