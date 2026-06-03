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
  assert.equal(records[0].extractedData.category, null);
});

test("validateSchemaAgainstSample requires computedStatus when the schema includes computed fields", () => {
  const validationResult = validateSchemaAgainstSample(
    createComputedSchemaFields(),
    "function extractData(){ return { merchant: 'ACME', category: 'office' }; }",
    { body: "<html></html>" },
  );

  assert.equal(validationResult.ok, false);
  assert.match(validationResult.message || "", /computedStatus/);
});

test("validateSchemaAgainstSample accepts computedStatus alongside schema fields", () => {
  const validationResult = validateSchemaAgainstSample(
    createComputedSchemaFields(),
    "function extractData(){ return { merchant: 'ACME', category: 'office', computedStatus: 'pending' }; }",
    { body: "<html></html>" },
  );

  assert.equal(validationResult.ok, true);
});
