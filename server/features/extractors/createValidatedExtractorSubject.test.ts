import test from "node:test";
import assert from "node:assert/strict";
import { createValidatedExtractorSubject } from "./createValidatedExtractorSubject";

test("createValidatedExtractorSubject persists the validation sample and output", () => {
  const result = createValidatedExtractorSubject({
    schemaFields: [
      { fieldName: "merchant", fieldType: "string", description: "", exampleValue: "" },
    ],
    subject: "Alert 1",
    scriptCode: "function extractData(body){ return { merchant: body.includes('alert 1') ? 'A' : '' }; }",
    validationSample: {
      body: "<html>alert 1</html>",
      subject: "Alert 1",
      from: "bank@example.com",
    },
  });

  assert.equal(result.subject.value, "Alert 1");
  assert.deepEqual(result.subject.validationSample, {
    body: "<html>alert 1</html>",
    subject: "Alert 1",
    from: "bank@example.com",
  });
  assert.match(result.validationResult.extractedData, /merchant/);
  assert.equal(result.subject.validationResult?.emailId, result.validationResult.emailId);
});

test("createValidatedExtractorSubject rejects null or empty field values", () => {
  assert.throws(() => createValidatedExtractorSubject({
    schemaFields: [
      { fieldName: "merchant", fieldType: "string", description: "", exampleValue: "" },
    ],
    subject: "Alert 1",
    scriptCode: "function extractData(){ return { merchant: '' }; }",
    validationSample: {
      body: "<html>alert 1</html>",
    },
  }), /null or empty values/);
});
