import { GoogleGenAI, Type } from "@google/genai";
import { SchemaField } from "../../../src/types";
import { GmailMessageDetail } from "../emails/fetchGmailMessageDetail";
import { generateGeminiJsonContent } from "./generateGeminiJsonContent";
import { SchemaExtractionResult } from "./SchemaExtractionResult";

interface ExistingSchemaContext {
  extractorName: string;
  detectedType: string;
  explanation: string;
}

export async function extractEmailsWithSchema(
  emails: GmailMessageDetail[],
  schemaFields: SchemaField[],
  context: ExistingSchemaContext,
): Promise<SchemaExtractionResult[]> {
  if (emails.length === 0) {
    return [];
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const ai = new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: {
      headers: {
        "User-Agent": "organizr",
      },
    },
  });

  const schemaText = schemaFields
    .map((field) => `- ${field.fieldName} (${field.fieldType}): ${field.description}. Example: ${field.exampleValue}`)
    .join("\n");

  const emailSamplesText = emails.map((mail, idx) => `
=== EMAIL #${idx + 1} ===
ID: ${mail.id}
From: ${mail.from}
Subject: ${mail.subject}
Date: ${mail.date}
Snippet: ${mail.snippet}
Body content:
${mail.body ? mail.body.substring(0, 4000) : mail.snippet}
=============================
`).join("\n\n");

  const prompt = `
You extract structured data from new Gmail messages for an existing extractor.
Do not create a new schema. Do not rename fields. Use exactly the existing schema field names.

Extractor name: ${context.extractorName}
Detected type: ${context.detectedType}
Existing explanation: ${context.explanation}

Existing schema fields:
${schemaText}

For each email, return a JSON-stringified object containing every existing schema field. If a value is not present, use null for that field.

Emails to extract:
${emailSamplesText}
`;

  const response = await generateGeminiJsonContent(
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
