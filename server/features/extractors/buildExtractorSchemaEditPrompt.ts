import { Extractor } from "../../types";

export function buildExtractorSchemaEditPrompt(
  extractor: Extractor,
  chatText: string,
  message: string,
): string {
  return `
You edit an existing Gmail extraction schema and parser.
Return JSON only. Keep the extractor usable after the edit.

Rules:
- Apply the user's requested schema/form change.
- Keep existing fields unless the user asks to remove or rename them.
- Regenerate each affected subject script as a complete JavaScript function extractData(body, subject, sender).
- Every subject scriptCode must return keys exactly matching schemaFields fieldName values.
- For computed/calculated fields, use fieldType "computed" and include a calculation instruction.
- Do not invent unrelated fields.

Extractor:
${JSON.stringify({
  name: extractor.name,
  explanation: extractor.explanation,
  schemaFields: extractor.schemaFields,
  subjects: extractor.subjects.map((subject) => ({
    id: subject.id,
    value: subject.value,
    scriptCode: subject.scriptCode || "",
  })),
}, null, 2)}

Recent chat:
${chatText || "No previous chat."}

Latest user request:
${message}
`;
}
