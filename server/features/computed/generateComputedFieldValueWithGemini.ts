import { Type } from "@google/genai";
import { SchemaField } from "../../../src/types";
import { ExtractionRecord } from "../../types";
import { createGeminiClient } from "../llm/createGeminiClient";
import { generateGeminiJsonContent } from "../llm/generateGeminiJsonContent";
import { hasUsableComputedValue } from "./hasUsableComputedValue";

interface GenerateComputedFieldValueParams {
  userId: string;
  extractorName: string;
  field: SchemaField;
  record: ExtractionRecord;
}

export async function generateComputedFieldValueWithGemini({
  userId,
  extractorName,
  field,
  record,
}: GenerateComputedFieldValueParams): Promise<unknown> {
  try {
    const ai = createGeminiClient();

    const response = await generateGeminiJsonContent(
      userId,
      ai,
      `
Compute one field value for an existing extraction record.
Return only JSON matching the provided response schema.

Extractor: ${extractorName}
Target field: ${field.fieldName}
Target description: ${field.description}
Target example: ${field.exampleValue}
Calculation instruction: ${field.computedPrompt || field.calculation || `Compute ${field.fieldName} from the current record using the instruction.`}

Current record:
${JSON.stringify(record.extractedData)}
`,
      {
        type: Type.OBJECT,
        properties: {
          value: {
            type: Type.STRING,
            description: "Computed value for the target field. Use an empty string when it cannot be inferred.",
          },
        },
        required: ["value"],
      },
    );

    const parsed = JSON.parse(response.text || "{\"value\":\"\"}");
    return hasUsableComputedValue(parsed.value) ? parsed.value : null;
  } catch (error) {
    console.warn(`Computed field LLM fallback failed for ${field.fieldName}:`, error);
    return null;
  }
}
