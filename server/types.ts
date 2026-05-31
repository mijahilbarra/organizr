import { SchemaField } from "../src/types";

export interface ExtractionRecord {
  id: string;
  emailId: string;
  subject: string;
  date: string;
  from: string;
  extractedData: Record<string, any>;
  timestamp: string;
}

export interface Extractor {
  id: string;
  name: string;
  query: string;
  detectedType: string;
  explanation: string;
  scriptCode: string;
  aiScriptCode: string;
  schemaFields: SchemaField[];
  webhookUrl: string;
  enabledSchedule: boolean;
  triggerCount: number;
  extractions: ExtractionRecord[];
  createdAt: string;
}

export interface DatabaseSchema {
  extractors: Extractor[];
}
