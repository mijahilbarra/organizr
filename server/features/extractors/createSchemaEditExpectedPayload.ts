import { Extractor } from "../../types";
import { createSchemaEditCurrentParsers } from "./createSchemaEditCurrentParsers";

export function createSchemaEditExpectedPayload(extractor: Extractor) {
  return {
    schemaFields: extractor.schemaFields,
    subjectScripts: createSchemaEditCurrentParsers(extractor).map((subject) => ({
      ...subject,
      validationSample: {
        body: "<html>...</html>",
        subject: subject.subject,
        from: "",
      },
    })),
  };
}
