import { Type } from "@google/genai";

export function createSchemaFieldResponseSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      fieldName: { type: Type.STRING, description: "camelCase name of the variable" },
      fieldType: { type: Type.STRING, description: "Data model Type (e.g., string, number, boolean, array, computed)" },
      description: { type: Type.STRING, description: "Descriptive explanation of the field" },
      exampleValue: { type: Type.STRING, description: "Real or representative value parsed from samples" },
      calculation: { type: Type.STRING, description: "For computed fields, a concise human-readable calculation instruction. Empty string for non-computed fields." },
      computedSourceField: { type: Type.STRING, description: "Required when fieldType is computed/calculado/calculated. Existing schema fieldName used to find similar previous records and fill placeholders, e.g. merchant. Empty string for non-computed fields." },
      computedPrompt: { type: Type.STRING, description: "Required when fieldType is computed/calculado/calculated. Prompt template with placeholders like {{merchant}}. Empty string for non-computed fields." },
      computedFallback: { type: Type.STRING, description: "Required when fieldType is computed/calculado/calculated. Default value if no similar record or LLM value is usable. Empty string for non-computed fields." },
    },
    required: ["fieldName", "fieldType", "description", "exampleValue", "calculation", "computedSourceField", "computedPrompt", "computedFallback"],
  };
}
