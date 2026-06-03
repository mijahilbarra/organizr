import { SchemaField } from "../../../src/types";

export function isComputedSchemaField(field: SchemaField): boolean {
  const normalizedType = field.fieldType.trim().toLowerCase();
  return normalizedType === "computed" || normalizedType === "calculado" || normalizedType === "calculated";
}
