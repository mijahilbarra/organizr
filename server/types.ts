import { EmailMessage, SampleExtractionResult, SchemaField } from "../src/types";

export interface ExtractionRecord {
  id: string;
  emailId: string;
  subject: string;
  date: string;
  from: string;
  extractedData: Record<string, any>;
  timestamp: string;
  computedStatus?: "pending" | "complete";
  pendingComputedFields?: string[];
}

export interface ExtractorSubject {
  id: string;
  value: string;
  createdAt: string;
  lastScannedAt?: string;
  scriptCode?: string;
}

export interface ExtractorSubjectScript {
  subject: string;
  scriptCode: string;
}

export interface Extractor {
  id: string;
  userId: string;
  name: string;
  query: string;
  subjects: ExtractorSubject[];
  explanation: string;
  schemaFields: SchemaField[];
  sampleEmails: EmailMessage[];
  sampleExtractedResults: SampleExtractionResult[];
  webhookUrl: string;
  enabledSchedule: boolean;
  triggerCount: number;
  operationCount: number;
  extractions: ExtractionRecord[];
  createdAt: string;
}

export interface GmailConnection {
  accessToken: string;
  connectedAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface LlmConsumeMonth {
  requestCount: number;
  promptTokenCount: number;
  candidateTokenCount: number;
  totalTokenCount: number;
}

export type LlmProvider = "auto" | "gemini" | "openai";

export interface UserLlmSettings {
  defaultProvider: LlmProvider;
  geminiApiKey?: string;
  openAiApiKey?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  updatedAt: string;
  gmailConnection: GmailConnection | null;
  llmConsumeByMonth: Record<string, LlmConsumeMonth>;
  llmSettings: UserLlmSettings;
}
