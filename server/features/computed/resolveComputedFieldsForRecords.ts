import { SchemaField } from "../../../src/types";
import { ExtractionRecord, UserProfile } from "../../types";
import { getComputedSchemaFields } from "./getComputedSchemaFields";
import { hasUsableComputedValue } from "./hasUsableComputedValue";
import { normalizeComputedSchemaFields } from "./normalizeComputedSchemaFields";
import { createPendingComputedRecord } from "./createPendingComputedRecord";
import { resolveComputedFieldValue } from "./resolveComputedFieldValue";
import { createUserCapabilities } from "../profile/createUserCapabilities";

interface ResolveComputedFieldsForRecordsParams {
  profile: UserProfile;
  extractorName: string;
  schemaFields: SchemaField[];
  records: ExtractionRecord[];
}

export async function resolveComputedFieldsForRecords({
  profile,
  extractorName,
  schemaFields,
  records,
}: ResolveComputedFieldsForRecordsParams): Promise<ExtractionRecord[]> {
  const normalizedSchemaFields = normalizeComputedSchemaFields(schemaFields);
  const computedFields = getComputedSchemaFields(normalizedSchemaFields);
  if (computedFields.length === 0 || records.length === 0) {
    return records;
  }
  const llmAvailable = createUserCapabilities(profile).llm.hasAnyProvider;

  const resolvedRecords: ExtractionRecord[] = [];

  for (const record of records) {
    const resolvedRecord = createPendingComputedRecord(normalizedSchemaFields, record);
    const pendingComputedFields = new Set<string>(resolvedRecord.pendingComputedFields || []);

    for (const field of computedFields) {
      if (!llmAvailable) {
        continue;
      }

      const value = await resolveComputedFieldValue({
        profile,
        extractorName,
        field,
        record: resolvedRecord,
      });

      if (hasUsableComputedValue(value)) {
        resolvedRecord.extractedData[field.fieldName] = value;
        pendingComputedFields.delete(field.fieldName);
      } else {
        resolvedRecord.extractedData[field.fieldName] = "";
        pendingComputedFields.add(field.fieldName);
      }
    }

    resolvedRecord.computedStatus = pendingComputedFields.size > 0 ? "pending" : "complete";
    resolvedRecord.pendingComputedFields = [...pendingComputedFields];
    resolvedRecords.push(resolvedRecord);
  }

  return resolvedRecords;
}
