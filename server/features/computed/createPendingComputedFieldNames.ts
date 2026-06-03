import { SchemaField } from "../../../src/types";
import { ExtractionRecord } from "../../types";
import { getComputedSchemaFields } from "./getComputedSchemaFields";
import { hasUsableComputedValue } from "./hasUsableComputedValue";

export function createPendingComputedFieldNames(schemaFields: SchemaField[], record: ExtractionRecord): string[] {
  return getComputedSchemaFields(schemaFields)
    .filter((field) => !hasUsableComputedValue(record.extractedData?.[field.fieldName]))
    .map((field) => field.fieldName);
}
