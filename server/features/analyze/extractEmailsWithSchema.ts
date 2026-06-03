import { Type } from "@google/genai";
import { SchemaField } from "../../../src/types";
import { GmailMessageDetail } from "../emails/fetchGmailMessageDetail";
import { createGeminiClient } from "../llm/createGeminiClient";
import { generateGeminiJsonContent } from "../llm/generateGeminiJsonContent";
import { formatEmailSamples } from "./formatEmailSamples";
import { SchemaExtractionResult } from "./SchemaExtractionResult";

interface ExistingSchemaContext {
  extractorName: string;
  explanation: string;
}

export async function extractEmailsWithSchema(
  userId: string,
  emails: GmailMessageDetail[],
  schemaFields: SchemaField[],
  context: ExistingSchemaContext,
): Promise<SchemaExtractionResult[]> {
  if (emails.length === 0) {
    return [];
  }

  const ai = createGeminiClient();

  const schemaText = schemaFields
    .map((field) => `- ${field.fieldName} (${field.fieldType}): ${field.description}. Example: ${field.exampleValue}`)
    .join("\n");

  const emailSamplesText = formatEmailSamples(emails);

  const prompt = `
You extract structured data from new Gmail messages for an existing extractor.
Do not create a new schema. Do not rename fields. Use exactly the existing schema field names.

Extractor name: ${context.extractorName}
Existing explanation: ${context.explanation}

Existing schema fields:
${schemaText}

For each email, return a JSON-stringified object containing every existing schema field. If a value is not present, use null for that field.

Emails to extract:
${emailSamplesText}
`;

  const response = await generateGeminiJsonContent(
    userId,
    ai,
    prompt,
    {
      type: Type.OBJECT,
      properties: {
        results: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              emailId: { type: Type.STRING },
              extractedData: {
                type: Type.STRING,
                description: "JSON stringified object using exactly the existing schema field names.",
              },
            },
            required: ["emailId", "extractedData"],
          },
        },
      },
      required: ["results"],
    },
  );

  const text = response.text || "{\"results\":[]}";
  const parsed = JSON.parse(text);
  return Array.isArray(parsed.results) ? parsed.results : [];
}
