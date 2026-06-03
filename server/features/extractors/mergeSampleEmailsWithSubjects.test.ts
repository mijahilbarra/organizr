import test from "node:test";
import assert from "node:assert/strict";
import { mergeSampleEmailsWithSubjects } from "./mergeSampleEmailsWithSubjects";

test("mergeSampleEmailsWithSubjects adds validation sample emails using persisted validation ids", () => {
  const merged = mergeSampleEmailsWithSubjects([], [
    {
      id: "sub_1",
      value: "Alert 1",
      createdAt: "2026-06-03T00:00:00.000Z",
      scriptCode: "function extractData(){ return { merchant: 'A' }; }",
      validationSample: {
        body: "<html>alert 1</html>",
        subject: "Alert 1",
        from: "bank@example.com",
      },
      validationResult: {
        emailId: "sample_1",
        extractedData: "{\"merchant\":\"A\"}",
        validatedAt: "2026-06-03T00:00:00.000Z",
      },
    },
  ]);

  assert.deepEqual(merged, [
    {
      id: "sample_1",
      threadId: "",
      subject: "Alert 1",
      from: "bank@example.com",
      date: "",
      snippet: "<html>alert 1</html>",
      body: "<html>alert 1</html>",
    },
  ]);
});
