import test from "node:test";
import assert from "node:assert/strict";
import { Request } from "express";
import { createGptExtractorRequest } from "./createGptExtractorRequest";

test("createGptExtractorRequest preserves a provided validationSample without emails", () => {
  const request = {
    body: {
      name: "CMR",
    },
  } as Request;

  const result = createGptExtractorRequest(
    request,
    {
      schemaFields: [],
      scriptCode: "function extractData(){ return {}; }",
    },
    "Notificacion",
    [],
    {
      body: "<html>sample</html>",
      subject: "Notificacion",
      from: "bank@example.com",
    },
  );

  assert.deepEqual(result.body.subjectScripts, [
    {
      subject: "Notificacion",
      scriptCode: "function extractData(){ return {}; }",
      validationSample: {
        body: "<html>sample</html>",
        subject: "Notificacion",
        from: "bank@example.com",
      },
    },
  ]);
});
