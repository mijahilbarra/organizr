import test from "node:test";
import assert from "node:assert/strict";
import { createSchemaEditManualPayload } from "./createSchemaEditManualPayload";
import { createSchemaEditTestExtractor } from "./createSchemaEditTestExtractor";

test("createSchemaEditManualPayload reads nested analysis subjectScripts", () => {
  const payload = createSchemaEditManualPayload({
    analysis: {
      explanation: "Updated",
      schemaFields: [
        { fieldName: "amount", fieldType: "string", description: "Amount", exampleValue: "10" },
      ],
      subjectScripts: [
        {
          subjectId: "sub_1",
          subject: "Alert 1",
          scriptCode: "function extractData(){ return { amount: '10' }; }",
        },
      ],
    },
  }, createSchemaEditTestExtractor());

  assert.equal(payload.explanation, "Updated");
  assert.deepEqual(payload.schemaFields?.map((field) => field.fieldName), ["amount"]);
  assert.equal(payload.subjects?.length, 1);
  assert.equal(payload.subjects?.[0]?.id, "sub_1");
  assert.equal(payload.subjects?.[0]?.value, "Alert 1");
});

test("createSchemaEditManualPayload applies shared analysis.scriptCode to current subjects", () => {
  const payload = createSchemaEditManualPayload({
    analysis: {
      explanation: "Updated",
      schemaFields: [
        { fieldName: "transactionDate", fieldType: "string", description: "Date", exampleValue: "2026-06-03" },
      ],
      scriptCode: "function extractData(){ return { transactionDate: '2026-06-03' }; }",
    },
  }, createSchemaEditTestExtractor());

  assert.equal(payload.subjects?.length, 2);
  assert.deepEqual(
    payload.subjects?.map((subject) => subject.scriptCode),
    [
      "function extractData(){ return { transactionDate: '2026-06-03' }; }",
      "function extractData(){ return { transactionDate: '2026-06-03' }; }",
    ],
  );
});

test("createSchemaEditManualPayload ignores empty subject entries", () => {
  const payload = createSchemaEditManualPayload({
    subjectScripts: [
      { subject: "", scriptCode: "function extractData(){ return {}; }" },
      { subject: "Alert 1", scriptCode: "" },
      { subject: "Alert 2", scriptCode: "function extractData(){ return { merchant: 'B' }; }" },
    ],
  }, createSchemaEditTestExtractor());

  assert.equal(payload.subjects?.length, 1);
  assert.equal(payload.subjects?.[0]?.value, "Alert 2");
});
