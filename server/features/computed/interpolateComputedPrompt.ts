import { ExtractionRecord } from "../../types";

export function interpolateComputedPrompt(prompt: string, record: ExtractionRecord): string {
  return prompt.replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g, (_match, fieldName: string) => {
    const value = record.extractedData?.[fieldName];
    if (value === null || value === undefined) {
      return "";
    }

    return typeof value === "object" ? JSON.stringify(value) : String(value);
  });
}
