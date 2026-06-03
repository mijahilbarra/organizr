import { SchemaField } from "../../../src/types";
import { isComputedSchemaField } from "./isComputedSchemaField";

export function normalizeComputedSchemaField(field: SchemaField, schemaFields: SchemaField[]): SchemaField {
  if (!isComputedSchemaField(field)) {
    return {
      ...field,
      calculation: field.calculation || "",
      computedPrompt: field.computedPrompt || "",
      computedFallback: field.computedFallback || "",
    };
  }

  const computedPrompt = field.computedPrompt || field.calculation || `Compute ${field.fieldName} from the current record using the instruction.`;

  return {
    ...field,
    fieldType: "computed",
    calculation: field.calculation || computedPrompt,
    computedPrompt,
    computedFallback: field.computedFallback || field.exampleValue || "",
  };
}
