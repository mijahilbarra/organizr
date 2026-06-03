import { SchemaField } from "../../../src/types";
import { normalizeComputedSchemaField } from "./normalizeComputedSchemaField";

export function normalizeComputedSchemaFields(schemaFields: SchemaField[]): SchemaField[] {
  return schemaFields.map((field) => normalizeComputedSchemaField(field, schemaFields));
}
