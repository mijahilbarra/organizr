import { SchemaField } from "../../../src/types";
import { ExtractionRecord } from "../../types";
import { createPendingComputedRecord } from "./createPendingComputedRecord";
import { getComputedSchemaFields } from "./getComputedSchemaFields";
import { normalizeComputedSchemaFields } from "./normalizeComputedSchemaFields";

export function createRecordsWithPendingComputedStatus(
  schemaFields: SchemaField[],
  records: ExtractionRecord[],
): ExtractionRecord[] {
  const normalizedSchemaFields = normalizeComputedSchemaFields(schemaFields);

  if (getComputedSchemaFields(normalizedSchemaFields).length === 0) {
    return records;
  }

  return records.map((record) => createPendingComputedRecord(normalizedSchemaFields, record));
}
