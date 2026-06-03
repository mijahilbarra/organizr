import { SchemaField } from "../../../src/types";

export function inferComputedSourceField(field: SchemaField, schemaFields: SchemaField[]): string {
  const promptText = `${field.computedPrompt || ""} ${field.calculation || ""}`;
  const placeholderMatch = promptText.match(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/);

  if (placeholderMatch) {
    return placeholderMatch[1];
  }

  const normalizedText = promptText.toLowerCase();
  const candidate = schemaFields.find((schemaField) =>
    schemaField.fieldName !== field.fieldName
    && normalizedText.includes(schemaField.fieldName.toLowerCase())
  );

  return candidate?.fieldName || "";
}
