import test from "node:test";
import assert from "node:assert/strict";
import { createExtractorStoredSamples } from "./createExtractorStoredSamples";

test("createExtractorStoredSamples keeps normalized sample emails and extracted results", () => {
  const storedSamples = createExtractorStoredSamples(
    [
      {
        id: "mail_1",
        threadId: "thread_1",
        subject: "Alert 1",
        from: "bank@example.com",
        date: "2026-06-03",
        snippet: "merchant A",
        body: "<html>alert 1</html>",
      },
    ],
    [
      {
        emailId: "mail_1",
        extractedData: "{\"merchant\":\"A\"}",
      },
    ],
  );

  assert.equal(storedSamples.sampleEmails.length, 1);
  assert.equal(storedSamples.sampleExtractedResults.length, 1);
  assert.equal(storedSamples.sampleEmails[0].id, "mail_1");
});
