import test from "node:test";
import assert from "node:assert/strict";
import { createSampleExtractedResults } from "./createSampleExtractedResults";
import { createSchemaEditTestExtractor } from "./createSchemaEditTestExtractor";

test("createSampleExtractedResults recalculates extracted data from the current parser and samples", () => {
  const extractor = createSchemaEditTestExtractor();
  extractor.subjects = [
    {
      ...extractor.subjects[0],
      scriptCode: "function extractData(body, subject, sender){ return { merchant: body.includes('alert 1') ? 'A' : 'unknown' }; }",
    },
    {
      ...extractor.subjects[1],
      scriptCode: "function extractData(body, subject, sender){ return { merchant: body.includes('alert 2') ? 'B' : 'unknown' }; }",
    },
  ];
  extractor.sampleEmails = [
    extractor.sampleEmails[0],
    {
      id: "mail_2",
      threadId: "thread_2",
      subject: "Alert 2",
      from: "bank@example.com",
      date: "2026-06-03",
      snippet: "merchant B",
      body: "<html>alert 2</html>",
    },
  ];

  const results = createSampleExtractedResults(extractor.sampleEmails, extractor.subjects);

  assert.deepEqual(results, [
    {
      emailId: "mail_1",
      extractedData: "{\"merchant\":\"A\"}",
    },
    {
      emailId: "mail_2",
      extractedData: "{\"merchant\":\"B\"}",
    },
  ]);
});
