import test from "node:test";
import assert from "node:assert/strict";
import { createSchemaEditStoredSamples } from "./createSchemaEditStoredSamples";
import { createSchemaEditTestExtractor } from "./createSchemaEditTestExtractor";

test("createSchemaEditStoredSamples appends validation samples for future edits", () => {
  const storedSamples = createSchemaEditStoredSamples(createSchemaEditTestExtractor(), {
    subjectScripts: [
      {
        subject: "Alert 2",
        scriptCode: "function extractData(){ return { merchant: 'B' }; }",
        validationSample: {
          body: "<html>alert 2</html>",
          subject: "Alert 2",
          from: "bank@example.com",
        },
      },
    ],
  });

  assert.equal(storedSamples.sampleEmails.length, 2);
  assert.equal(storedSamples.sampleExtractedResults.length, 1);
  assert.equal(storedSamples.sampleEmails[1].subject, "Alert 2");
});
