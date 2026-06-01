export interface EmailConfig {
  hasFirebaseProjectId: boolean;
  hasFirebaseAdminCredentials: boolean;
  hasGeminiKey: boolean;
  appUrl: string;
  firestoreUsersCollection: string;
  firestoreExtractorsCollection: string;
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
  debugLogs?: string[];
}

export interface ExtractionRecord {
  id: string;
  emailId?: string;
  subject: string;
  from: string;
  date: string;
  extractedData: Record<string, any>;
  timestamp?: string;
}

export interface ExtractorSubject {
  id: string;
  value: string;
  createdAt: string;
  lastScannedAt?: string;
}

export interface Extractor {
  id: string;
  userId: string;
  name: string;
  query: string;
  subjects: ExtractorSubject[];
  detectedType: string;
  explanation: string;
  scriptCode: string;
  aiScriptCode: string;
  schemaFields: SchemaField[];
  enabledSchedule: boolean;
  webhookUrl?: string;
  operationCount: number;
  extractions: ExtractionRecord[];
}

export interface AddExtractorSubjectResponse {
  extractor: Extractor;
  newCount: number;
  scannedCount: number;
  message: string;
}

export interface ExtractorOperationsPage {
  operations: ExtractionRecord[];
  nextCursor: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  updatedAt: string;
  gmailConnection: null | {
    connectedAt: string;
    expiresAt: string;
    revokedAt?: string;
  };
}

export type TicketState = "backlog" | "todo" | "doing" | "onreview" | "done";

export type TicketUrgency = 1 | 2 | 3 | 4 | 5;

export interface Ticket {
  id: string;
  description: string;
  urgency: TicketUrgency;
  state: TicketState;
  user: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
