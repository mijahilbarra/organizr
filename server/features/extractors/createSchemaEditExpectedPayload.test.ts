import test from "node:test";
import assert from "node:assert/strict";
import { createSchemaEditExpectedPayload } from "./createSchemaEditExpectedPayload";
import { createSchemaEditTestExtractor } from "./createSchemaEditTestExtractor";

test("createSchemaEditExpectedPayload returns the second-call contract for agents", () => {
  const extractor = createSchemaEditTestExtractor();

  const payload = createSchemaEditExpectedPayload(extractor);

  assert.deepEqual(payload.schemaFields, extractor.schemaFields);
  assert.equal(payload.subjectScripts.length, 2);
  assert.deepEqual(payload.subjectScripts[0], {
    subjectId: "sub_1",
    subject: "Alert 1",
    scriptCode: "function extractData(){ return { merchant: 'A' }; }",
    validationSample: {
      body: "<html>alert 1</html>",
      subject: "Alert 1",
      from: "bank@example.com",
    },
  });
});
