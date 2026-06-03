import { GoogleGenAI } from "@google/genai";
import { createConsumeMonthKey } from "../profile/createConsumeMonthKey";
import { incrementUserLlmConsumeForMonth } from "../profile/incrementUserLlmConsumeForMonth";
import { getGeminiResponseTokenConsume } from "./getGeminiResponseTokenConsume";
import { isGeminiHighDemandError } from "./isGeminiHighDemandError";
import { waitForGeminiRetryCountdown } from "./waitForGeminiRetryCountdown";

export async function generateGeminiJsonContent(
  userId: string,
  ai: GoogleGenAI,
  contents: string,
  responseSchema: Record<string, any>,
  onLog: (message: string) => void = console.log,
) {
  const retryLimit = 3;
  let attempt = 0;
  let response;

  while (!response) {
    try {
      attempt += 1;
      onLog(`Sending Gemini request attempt ${attempt}/${retryLimit + 1}.`);
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });
    } catch (error) {
      if (!isGeminiHighDemandError(error) || attempt > retryLimit) {
        throw error;
      }

      onLog(`Gemini returned high demand 503/UNAVAILABLE on attempt ${attempt}. Retrying after 30 seconds.`);
      await waitForGeminiRetryCountdown(30, onLog);
    }
  }

  await incrementUserLlmConsumeForMonth(
    userId,
    createConsumeMonthKey(),
    getGeminiResponseTokenConsume(response),
  );

  return response;
}
