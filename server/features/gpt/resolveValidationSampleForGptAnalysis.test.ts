import test from "node:test";
import assert from "node:assert/strict";
import { resolveValidationSampleForGptAnalysis } from "./resolveValidationSampleForGptAnalysis";

test("resolveValidationSampleForGptAnalysis prefers top-level validationSample", () => {
  const result = resolveValidationSampleForGptAnalysis(
    {
      validationSample: {
        body: "<html>top-level</html>",
        subject: "Alert",
        from: "sender@example.com",
      },
    },
    "Alert",
    [],
  );

  assert.deepEqual(result, {
    body: "<html>top-level</html>",
    subject: "Alert",
    from: "sender@example.com",
  });
});

test("resolveValidationSampleForGptAnalysis falls back to emails returned by subject search", () => {
  const result = resolveValidationSampleForGptAnalysis(
    {},
    "Alert",
    [
      {
        subject: "Alert",
        body: "<html>email body</html>",
        from: "sender@example.com",
      },
    ],
  );

  assert.deepEqual(result, {
    body: "<html>email body</html>",
    subject: "Alert",
    from: "sender@example.com",
  });
});
