import { Extractor } from "../../types";

export function createSchemaEditCurrentParsers(extractor: Extractor) {
  return extractor.subjects.map((subject) => ({
    subjectId: subject.id,
    subject: subject.value,
    scriptCode: subject.scriptCode || "",
    validationSample: subject.validationSample || null,
  }));
}
