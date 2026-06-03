import test from "node:test";
import assert from "node:assert/strict";
import { createSchemaEditCurrentParsers } from "./createSchemaEditCurrentParsers";
import { createSchemaEditTestExtractor } from "./createSchemaEditTestExtractor";

test("createSchemaEditCurrentParsers exposes current parser scripts for the agent", () => {
  const parsers = createSchemaEditCurrentParsers(createSchemaEditTestExtractor());

  assert.deepEqual(parsers, [
    {
      subjectId: "sub_1",
      subject: "Alert 1",
      scriptCode: "function extractData(){ return { merchant: 'A' }; }",
    },
    {
      subjectId: "sub_2",
      subject: "Alert 2",
      scriptCode: "function extractData(){ return { merchant: 'B' }; }",
    },
  ]);
});
