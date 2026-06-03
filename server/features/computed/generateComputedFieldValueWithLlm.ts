import { SchemaField } from "../../../src/types";
import { ExtractionRecord, UserProfile } from "../../types";
import { hasUsableComputedValue } from "./hasUsableComputedValue";
import { generateResolvedLlmJsonContent } from "../llm/generateResolvedLlmJsonContent";

interface GenerateComputedFieldValueWithLlmParams {
  profile: UserProfile;
  extractorName: string;
  field: SchemaField;
  record: ExtractionRecord;
}

export async function generateComputedFieldValueWithLlm({
  profile,
  extractorName,
  field,
  record,
}: GenerateComputedFieldValueWithLlmParams): Promise<unknown> {
  try {
    const response = await generateResolvedLlmJsonContent(
      profile,
      profile.llmSettings.defaultProvider,
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
        type: "object",
        properties: {
          value: {
            type: "string",
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
