import crypto from "crypto";
import { getOAuthCodesCollection } from "./getOAuthCodesCollection";

interface CreateOAuthCodeParams {
  firebaseIdToken: string;
  uid: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}

export async function createOAuthCode({
  firebaseIdToken,
  uid,
  clientId,
  redirectUri,
  scope,
}: CreateOAuthCodeParams) {
  const code = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000;
  const collection = await getOAuthCodesCollection();

  await collection.doc(code).set({
    firebaseIdToken,
    uid,
    clientId,
    redirectUri,
    scope,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    usedAt: null,
  });

  return code;
}
