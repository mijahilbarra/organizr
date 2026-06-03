import type { FirebaseAuthSession } from "../../firebase/FirebaseAuthSession";
import { createBackendHeadersForSession } from "../../firebase/createBackendHeadersForSession";
import type { ExtractorSchemaEditMessage, ExtractorSchemaEditProvider, ExtractorSchemaEditResponse } from "../../types";

export async function postExtractorSchemaEdit(
  firebaseSession: FirebaseAuthSession | null,
  extractorId: string,
  message: string,
  messages: ExtractorSchemaEditMessage[],
  provider: ExtractorSchemaEditProvider,
): Promise<ExtractorSchemaEditResponse> {
  const res = await fetch(`/api/extractors/${extractorId}/schema-edits`, {
    method: "POST",
    headers: createBackendHeadersForSession(firebaseSession, true),
    body: JSON.stringify({ message, messages, provider }),
  });

  if (!res.ok) {
    const errObj = await res.json();
    throw new Error(errObj.error || "Failed to submit schema edit.");
  }

  return res.json();
}
