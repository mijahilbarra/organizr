import { SchemaField } from "../../../src/types";
import { GmailMessageDetail } from "../emails/fetchGmailMessageDetail";
import { SchemaExtractionResult } from "../analyze/SchemaExtractionResult";
import { ExtractionRecord } from "../../types";

export function createExtractionRecordFromSchemaResult(
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

    return {
      id: `rec_${Math.random().toString(36).substring(2, 9)}`,
      emailId: email.id,
      subject: email.subject || "No Subject",
      date: email.date || "Unknown Date",
      from: email.from || "Unknown Sender",
      extractedData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`Schema extraction result parsing failed for email ${email.id}:`, error);
    return null;
  }
}
