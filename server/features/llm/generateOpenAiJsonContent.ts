import { createConsumeMonthKey } from "../profile/createConsumeMonthKey";
import { incrementUserLlmConsumeForMonth } from "../profile/incrementUserLlmConsumeForMonth";
import { getOpenAiResponseText } from "./getOpenAiResponseText";
import { getOpenAiResponseTokenConsume } from "./getOpenAiResponseTokenConsume";
import { normalizeJsonSchemaTypes } from "./normalizeJsonSchemaTypes";

export async function generateOpenAiJsonContent(
  userId: string,
  contents: string,
  responseSchema: Record<string, any>,
  onLog: (message: string) => void = console.log,
  apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY,
): Promise<{ text: string }> {
  if (!apiKey) {
    throw new Error("OPEN_AI_KEY is not configured on the server.");
  }

  onLog("Sending OpenAI request with model gpt-5.3-codex.");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.3-codex",
      input: contents,
      text: {
        format: {
          type: "json_schema",
          name: "extractor_schema_edit",
          strict: false,
          schema: normalizeJsonSchemaTypes(responseSchema),
        },
      },
    }),
  });

  const responseJson = await response.json();

  if (!response.ok) {
    throw new Error(responseJson?.error?.message || "OpenAI request failed.");
  }

  await incrementUserLlmConsumeForMonth(
    userId,
    createConsumeMonthKey(),
    getOpenAiResponseTokenConsume(responseJson),
  );

  return { text: getOpenAiResponseText(responseJson) || "{}" };
}
