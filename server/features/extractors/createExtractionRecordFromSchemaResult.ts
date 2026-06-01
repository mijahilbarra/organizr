import { SchemaField } from "../../../src/types";
import { GmailMessageDetail } from "../emails/fetchGmailMessageDetail";
import { SchemaExtractionResult } from "../analyze/SchemaExtractionResult";
import { ExtractionRecord } from "../../types";
import { createOperationRecord } from "../operations/createOperationRecord";

export function createExtractionRecordFromSchemaResult(
  extractorId: string,
  email: GmailMessageDetail,
  result: SchemaExtractionResult,
  schemaFields: SchemaField[],
): ExtractionRecord | null {
  try {
    const parsedData = JSON.parse(result.extractedData);
    const extractedData = schemaFields.reduce<Record<string, any>>((fields, field) => {
      fields[field.fieldName] = parsedData[field.fieldName] ?? null;
      return fields;
    }, {});

    return createOperationRecord(extractorId, email, extractedData);
  } catch (error) {
    console.warn(`Schema extraction result parsing failed for email ${email.id}:`, error);
    return null;
  }
}
