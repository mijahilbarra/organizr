export interface EmailConfig {
  hasFirebaseProjectId: boolean;
  hasFirebaseAdminCredentials: boolean;
  hasGeminiKey: boolean;
  hasOpenAiKey: boolean;
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
  calculation?: string;
  computedSourceField?: string;
  computedPrompt?: string;
  computedFallback?: string;
}

export interface SampleExtractionResult {
  emailId: string;
  extractedData: string; // JSON string of values
}

export interface ValidationSample {
  body: string;
  subject?: string;
  from?: string;
}

export interface SubjectValidationResult {
  emailId: string;
  extractedData: string;
  validatedAt: string;
}

export interface AnalysisResponse {
  explanation: string;
  schemaFields: SchemaField[];
  scriptCode: string;
  sampleExtractedResults: SampleExtractionResult[];
  debugLogs?: string[];
  provider?: "gemini" | "openai";
}

export interface ExtractionRecord {
  id: string;
  emailId?: string;
  subject: string;
  from: string;
  date: string;
  extractedData: Record<string, any>;
  timestamp?: string;
  computedStatus?: "pending" | "complete";
  pendingComputedFields?: string[];
}

export interface ExtractorSubject {
  id: string;
  value: string;
  createdAt: string;
  lastScannedAt?: string;
  scriptCode?: string;
  validationSample?: ValidationSample;
  validationResult?: SubjectValidationResult;
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
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  updatedAt: string;
  llmConsumeByMonth: Record<string, LlmConsumeMonth>;
  defaultLlmProvider?: LlmProviderPreference;
  capabilities?: UserCapabilities;
  llmSettings?: {
    defaultProvider: LlmProviderPreference;
    hasGeminiApiKey: boolean;
    hasOpenAiApiKey: boolean;
  };
  gmailConnection: null | {
    connectedAt: string;
    expiresAt: string;
    revokedAt?: string;
  };
}

export type LlmProviderPreference = "auto" | "gemini" | "openai";

export type UserCapabilityState = "available" | "missing" | "unknown" | "disabled";

export type UserCapabilitySource = "user" | "server" | null;

export interface UserGmailCapability {
  connected: boolean;
  actionCode: string | null;
  actionUrl: string;
}

export interface UserLlmProviderCapability {
  available: boolean;
  source: UserCapabilitySource;
  actionCode: string | null;
  actionUrl: string;
}

export interface UserLlmCapability {
  defaultProvider: LlmProviderPreference;
  providers: {
    gemini: UserLlmProviderCapability;
    openai: UserLlmProviderCapability;
  };
  hasAnyProvider: boolean;
  actionCode: string | null;
  actionUrl: string;
}

export interface UserCapabilities {
  gmail?: UserGmailCapability;
  llm?: UserLlmCapability;
  chatgpt?: {
    state: UserCapabilityState;
    message?: string;
    actionCode?: string;
    actionUrl?: string;
    actions?: Array<{
      code: string;
      label: string;
      actionUrl: string;
      state: UserCapabilityState;
      message?: string;
    }>;
  };
}

export interface LlmConsumeMonth {
  requestCount: number;
  promptTokenCount: number;
  candidateTokenCount: number;
  totalTokenCount: number;
}

export interface ExtractorSchemaEditMessage {
  role: "user" | "assistant";
  content: string;
}

export type ExtractorSchemaEditProvider = LlmProviderPreference;

export interface ExtractorSchemaEditResponse {
  extractor: Extractor;
  assistantMessage: string;
  debugLogs: string[];
  provider?: "gemini" | "openai";
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
