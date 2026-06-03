import { SchemaField } from "../../../src/types";
import { getComputedSchemaFields } from "./getComputedSchemaFields";
import { normalizeComputedSchemaFields } from "./normalizeComputedSchemaFields";

export function validateComputedStatusForSchemaOutput(
  schemaFields: SchemaField[],
  output: Record<string, any>,
): { ok: true } | { ok: false; message: string } {
  const normalizedSchemaFields = normalizeComputedSchemaFields(schemaFields);
  const computedFields = getComputedSchemaFields(normalizedSchemaFields);

  if (computedFields.length === 0) {
    return { ok: true };
  }

  if (!("computedStatus" in output)) {
    return { ok: true };
  }

  if (output.computedStatus !== "pending" && output.computedStatus !== "complete") {
    return {
      ok: false,
      message: 'Parser output computedStatus must be "pending" or "complete" when provided.',
    };
  }

  return { ok: true };
}
