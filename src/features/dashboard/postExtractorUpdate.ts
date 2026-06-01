import type { FirebaseAuthSession } from "../../firebase/FirebaseAuthSession";
import { createBackendHeadersForSession } from "../../firebase/createBackendHeadersForSession";
import type { Extractor } from "../../types";

export async function postExtractorUpdate(
  firebaseSession: FirebaseAuthSession | null,
  url: string,
  payload: Record<string, string>,
  fallbackError: string,
): Promise<Extractor> {
  const res = await fetch(url, {
    method: "POST",
    headers: createBackendHeadersForSession(firebaseSession, true),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errObj = await res.json();
    throw new Error(errObj.error || fallbackError);
  }

  return res.json();
}
