import test from "node:test";
import assert from "node:assert/strict";
import { createSchemaEditCurrentSamples } from "./createSchemaEditCurrentSamples";
import { createSchemaEditTestExtractor } from "./createSchemaEditTestExtractor";

test("createSchemaEditCurrentSamples exposes persisted sample context", () => {
  const samples = createSchemaEditCurrentSamples(createSchemaEditTestExtractor());

  assert.equal(samples.sampleEmails.length, 1);
  assert.equal(samples.sampleExtractedResults.length, 1);
  assert.equal(samples.sampleEmails[0].subject, "Alert 1");
});
