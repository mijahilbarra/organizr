import { SchemaField } from "../../../src/types";
import { compileExtractorScript } from "../analyze/compileExtractorScript";
import { getComputedSchemaFields } from "../computed/getComputedSchemaFields";
import { validateComputedStatusForSchemaOutput } from "../computed/validateComputedStatusForSchemaOutput";

interface ValidationSample {
  body: string;
  subject?: string;
  from?: string;
}

export function validateSchemaAgainstSample(
  schemaFields: SchemaField[],
  scriptCode: string,
  sample: ValidationSample,
): { ok: boolean; message?: string; output?: Record<string, any> } {
  const extractFn = compileExtractorScript(scriptCode);
  const output = extractFn(sample.body, String(sample.subject || ""), String(sample.from || ""));

  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return {
      ok: false,
      message: "The parser must return an object for validation.",
    };
  }

  const computedStatusValidation = validateComputedStatusForSchemaOutput(schemaFields, output);
  if (computedStatusValidation.ok === false) {
    return {
      ok: false,
      message: computedStatusValidation.message,
      output,
    };
  }

  const computedFieldNames = new Set(
    getComputedSchemaFields(schemaFields).map((field) => field.fieldName),
  );
  const schemaKeys = schemaFields.map((field) => field.fieldName).sort();
  const outputKeys = Object.keys(output)
    .filter((key) => key !== "computedStatus")
    .sort();
  const missingKeys = schemaKeys.filter(
    (key) => !computedFieldNames.has(key) && !outputKeys.includes(key),
  );
  const extraKeys = outputKeys.filter((key) => !schemaKeys.includes(key));

  if (missingKeys.length > 0 || extraKeys.length > 0) {
    const issues = [
      missingKeys.length > 0 ? `missing keys: ${missingKeys.join(", ")}` : "",
      extraKeys.length > 0 ? `extra keys: ${extraKeys.join(", ")}` : "",
    ].filter(Boolean).join(" | ");

    return {
      ok: false,
      message: `Parser output does not match schemaFields exactly: ${issues}.`,
      output,
    };
  }

  const invalidKeys = schemaFields
    .filter((field) => !computedFieldNames.has(field.fieldName))
    .map((field) => field.fieldName)
    .filter((fieldName) => {
      const value = output[fieldName];
      return value === null || value === undefined || value === "";
    });

  if (invalidKeys.length > 0) {
    return {
      ok: false,
      message: `Parser output contains null or empty values for: ${invalidKeys.join(", ")}.`,
      output,
    };
  }

  const invalidComputedPendingValues = schemaFields
    .filter((field) => computedFieldNames.has(field.fieldName))
    .map((field) => field.fieldName)
    .filter((fieldName) => {
      const value = output[fieldName];
      return typeof value === "string" && value.trim().length > 0;
    });

  if (invalidComputedPendingValues.length > 0) {
    return {
      ok: false,
      message: `Computed fields are registered as empty while pending: ${invalidComputedPendingValues.join(", ")}.`,
      output,
    };
  }

  return {
    ok: true,
    output,
  };
}
