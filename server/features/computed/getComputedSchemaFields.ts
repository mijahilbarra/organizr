import { SchemaField } from "../../../src/types";
import { isComputedSchemaField } from "./isComputedSchemaField";

export function getComputedSchemaFields(schemaFields: SchemaField[]): SchemaField[] {
  return schemaFields.filter(isComputedSchemaField);
}
