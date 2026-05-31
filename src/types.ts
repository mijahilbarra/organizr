export interface EmailConfig {
  hasFirebaseProjectId: boolean;
  hasFirebaseAdminCredentials: boolean;
  hasGeminiKey: boolean;
  appUrl: string;
  firestoreDbCollection: string;
  firestoreDbDocumentId: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
}

export interface SchemaField {
  fieldName: string;
  fieldType: string;
  description: string;
  exampleValue: string;
}

export interface SampleExtractionResult {
  emailId: string;
  extractedData: string; // JSON string of values
}

export interface AnalysisResponse {
  detectedType: string;
  explanation: string;
  schemaFields: SchemaField[];
  scriptCode: string;
  aiScriptCode: string;
  sampleExtractedResults: SampleExtractionResult[];
}

export interface ExtractionRecord {
  id: string;
  subject: string;
  from: string;
  date: string;
  extractedData: Record<string, any>;
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
  enabledSchedule: boolean;
  webhookUrl?: string;
  extractions: ExtractionRecord[];
}
