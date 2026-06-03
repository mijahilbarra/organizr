import { SubjectValidationResult, ValidationSample } from "../../../src/types";
import { ExtractorSubject } from "../../types";

export function createExtractorSubject(
  value: string,
  scriptCode?: string,
  validationSample?: ValidationSample,
  validationResult?: SubjectValidationResult,
): ExtractorSubject {
  return {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    value,
    createdAt: new Date().toISOString(),
    scriptCode,
    validationSample,
    validationResult,
  };
}
