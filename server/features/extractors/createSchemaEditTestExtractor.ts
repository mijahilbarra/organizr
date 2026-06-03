import { Extractor } from "../../types";

export function createSchemaEditTestExtractor(): Extractor {
  return {
    id: "ext_1",
    userId: "user_1",
    name: "Card Alerts",
    query: "card",
    subjects: [
      {
        id: "sub_1",
        value: "Alert 1",
        createdAt: "2026-06-03T00:00:00.000Z",
        scriptCode: "function extractData(){ return { merchant: 'A' }; }",
      },
      {
        id: "sub_2",
        value: "Alert 2",
        createdAt: "2026-06-03T00:00:00.000Z",
        scriptCode: "function extractData(){ return { merchant: 'B' }; }",
      },
    ],
    explanation: "desc",
    schemaFields: [
      { fieldName: "merchant", fieldType: "string", description: "", exampleValue: "" },
    ],
    sampleEmails: [
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
    sampleExtractedResults: [
      {
        emailId: "mail_1",
        extractedData: "{\"merchant\":\"A\"}",
      },
    ],
    webhookUrl: "",
    enabledSchedule: false,
    triggerCount: 0,
    operationCount: 0,
    extractions: [],
    createdAt: "2026-06-03T00:00:00.000Z",
  };
}
