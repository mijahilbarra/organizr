import { SchemaField } from "../../../src/types";
import { ExtractionRecord } from "../../types";
import { createPendingComputedFieldNames } from "./createPendingComputedFieldNames";
import { getComputedSchemaFields } from "./getComputedSchemaFields";
import { hasUsableComputedValue } from "./hasUsableComputedValue";

export function createPendingComputedRecord(schemaFields: SchemaField[], record: ExtractionRecord): ExtractionRecord {
  const computedFields = getComputedSchemaFields(schemaFields);
  const pendingComputedFields = createPendingComputedFieldNames(schemaFields, record);
  const extractedData = { ...record.extractedData };

  for (const field of computedFields) {
    if (!hasUsableComputedValue(extractedData[field.fieldName])) {
      extractedData[field.fieldName] = "";
    }
  }

  return {
    ...record,
    extractedData,
    computedStatus: pendingComputedFields.length > 0 ? "pending" : "complete",
    pendingComputedFields: pendingComputedFields.length > 0 ? pendingComputedFields : [],
  };
}
