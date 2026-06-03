import { SchemaField } from "../../../src/types";
import { ExtractionRecord, UserProfile } from "../../types";
import { generateComputedFieldValueWithLlm } from "./generateComputedFieldValueWithLlm";
import { hasUsableComputedValue } from "./hasUsableComputedValue";

interface ResolveComputedFieldValueParams {
  profile: UserProfile;
  extractorName: string;
  field: SchemaField;
  record: ExtractionRecord;
}

export async function resolveComputedFieldValue({
  profile,
  extractorName,
  field,
  record,
}: ResolveComputedFieldValueParams): Promise<unknown> {
  const currentValue = record.extractedData?.[field.fieldName];
  if (hasUsableComputedValue(currentValue)) {
    return currentValue;
  }

  return generateComputedFieldValueWithLlm({
    profile,
    extractorName,
    field,
    record,
  });
}
