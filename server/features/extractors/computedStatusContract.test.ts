import test from "node:test";
import assert from "node:assert/strict";
import { createRecordsWithPendingComputedStatus } from "../computed/createRecordsWithPendingComputedStatus";
import { validateSchemaAgainstSample } from "./validateSchemaAgainstSample";

function createComputedSchemaFields() {
  return [
    { fieldName: "merchant", fieldType: "string", description: "Merchant", exampleValue: "ACME" },
    {
      fieldName: "category",
      fieldType: "computed",
      description: "Category",
      exampleValue: "office",
      calculation: "Categorize the merchant.",
      computedSourceField: "merchant",
      computedPrompt: "Categorize {{merchant}}.",
      computedFallback: "uncategorized",
    },
  ];
}

test("createRecordsWithPendingComputedStatus marks computed-field operations as pending", () => {
  const records = createRecordsWithPendingComputedStatus(
    createComputedSchemaFields(),
    [
      {
        id: "op_1",
        emailId: "mail_1",
        subject: "Subject",
        date: "2026-06-03",
        from: "sender@example.com",
        extractedData: { merchant: "ACME" },
        timestamp: "2026-06-03T00:00:00.000Z",
      },
    ],
  );

  assert.equal(records[0].computedStatus, "pending");
  assert.deepEqual(records[0].pendingComputedFields, ["category"]);
  assert.equal(records[0].extractedData.category, "");
});

test("validateSchemaAgainstSample accepts parser output that omits computed fields", () => {
  const validationResult = validateSchemaAgainstSample(
    createComputedSchemaFields(),
    "function extractData(){ return { merchant: 'ACME' }; }",
    { body: "<html></html>" },
  );

  assert.equal(validationResult.ok, true);
});

test("validateSchemaAgainstSample accepts null or empty computed field placeholders", () => {
  const nullValidationResult = validateSchemaAgainstSample(
    createComputedSchemaFields(),
    "function extractData(){ return { merchant: 'ACME', category: null }; }",
    { body: "<html></html>" },
  );

  assert.equal(nullValidationResult.ok, true);

  const validationResult = validateSchemaAgainstSample(
    createComputedSchemaFields(),
    "function extractData(){ return { merchant: 'ACME', category: '' }; }",
    { body: "<html></html>" },
  );

  assert.equal(validationResult.ok, true);
});

test("validateSchemaAgainstSample rejects invalid computedStatus when provided", () => {
  const validationResult = validateSchemaAgainstSample(
    createComputedSchemaFields(),
    "function extractData(){ return { merchant: 'ACME', computedStatus: 'queued' }; }",
    { body: "<html></html>" },
  );

  assert.equal(validationResult.ok, false);
  assert.match(validationResult.message || "", /computedStatus/);
});

test("validateSchemaAgainstSample rejects non-empty pending computed values", () => {
  const validationResult = validateSchemaAgainstSample(
    createComputedSchemaFields(),
    "function extractData(){ return { merchant: 'ACME', category: 'office' }; }",
    { body: "<html></html>" },
  );

  assert.equal(validationResult.ok, false);
  assert.match(validationResult.message || "", /registered as empty while pending/);
});
