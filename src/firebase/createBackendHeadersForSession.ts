import type { FirebaseAuthSession } from "./FirebaseAuthSession";
import { createBackendHeaders } from "./createBackendHeaders";

export function createBackendHeadersForSession(
  session: FirebaseAuthSession | null,
  includeJson = false,
): Record<string, string> {
  return createBackendHeaders({
    firebaseIdToken: session?.firebaseIdToken || null,
    gmailAccessToken: session?.gmailAccessToken,
    includeJson,
  });
}
