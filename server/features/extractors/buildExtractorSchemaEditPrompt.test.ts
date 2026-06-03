import test from "node:test";
import assert from "node:assert/strict";
import { buildExtractorSchemaEditPrompt } from "./buildExtractorSchemaEditPrompt";
import { createSchemaEditTestExtractor } from "./createSchemaEditTestExtractor";

test("buildExtractorSchemaEditPrompt instructs the agent to remove obsolete fields", () => {
  const extractor = createSchemaEditTestExtractor();
  extractor.subjects = [
    {
      ...extractor.subjects[0],
      scriptCode: "function extractData(){ return { merchant: 'A', amount: '10' }; }",
    },
  ];
  extractor.schemaFields = [
    { fieldName: "merchant", fieldType: "string", description: "Merchant", exampleValue: "ACME" },
    { fieldName: "amount", fieldType: "string", description: "Amount", exampleValue: "10" },
    { fieldName: "obsolete", fieldType: "string", description: "Old", exampleValue: "x" },
  ];

  const prompt = buildExtractorSchemaEditPrompt(extractor, "", "remove obsolete");

  assert.match(prompt, /final schemaFields array must contain exactly the fields that should remain/i);
  assert.match(prompt, /remove obsolete fields/i);
  assert.match(prompt, /Every subject scriptCode must return keys exactly matching schemaFields fieldName values/i);
});
