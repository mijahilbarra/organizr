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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  updatedAt: string;
  gmailConnection: GmailConnection | null;
}
