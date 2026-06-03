import { SchemaField } from "../../../src/types";
import { ExtractionRecord } from "../../types";
import { interpolateComputedPrompt } from "./interpolateComputedPrompt";

export function buildComputedFieldPrompt(field: SchemaField, record: ExtractionRecord): string {
  const basePrompt = field.computedPrompt || field.calculation || `Compute ${field.fieldName} from the current record.`;
  return interpolateComputedPrompt(basePrompt, record);
}
