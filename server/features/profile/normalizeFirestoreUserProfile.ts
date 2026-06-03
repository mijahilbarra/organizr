import { UserProfile } from "../../types";
import { normalizeUserLlmSettings } from "./normalizeUserLlmSettings";

export function normalizeFirestoreUserProfile(id: string, data: unknown): UserProfile {
  const source = data && typeof data === "object" ? data as Partial<UserProfile> : {};

  return {
    uid: source.uid || id,
    email: source.email || "",
    displayName: source.displayName || "",
    photoURL: source.photoURL || "",
    createdAt: source.createdAt || "",
    updatedAt: source.updatedAt || "",
    gmailConnection: source.gmailConnection || null,
    llmConsumeByMonth: source.llmConsumeByMonth || {},
    llmSettings: normalizeUserLlmSettings(source.llmSettings),
  };
}
