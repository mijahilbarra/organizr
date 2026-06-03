import { Type } from "@google/genai";
import { createSchemaFieldResponseSchema } from "../analyze/createSchemaFieldResponseSchema";

export function createExtractorSchemaEditResponseSchema() {
  return {
    type: Type.OBJECT,
    additionalProperties: false,
    properties: {
      assistantMessage: { type: Type.STRING },
      explanation: { type: Type.STRING },
      schemaFields: {
        type: Type.ARRAY,
        items: createSchemaFieldResponseSchema(),
      },
    },
    required: ["assistantMessage", "explanation", "schemaFields"],
  };
}
