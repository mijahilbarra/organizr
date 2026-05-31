import { normalizeFirebasePrivateKey } from "./normalizeFirebasePrivateKey";

interface FirebaseServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export function getFirebaseServiceAccount(): FirebaseServiceAccount | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const rawServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const projectId = rawServiceAccount.project_id ?? rawServiceAccount.projectId;
    const clientEmail = rawServiceAccount.client_email ?? rawServiceAccount.clientEmail;
    const privateKey = rawServiceAccount.private_key ?? rawServiceAccount.privateKey;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT must include project_id, client_email, and private_key.");
    }

    return {
      projectId,
      clientEmail,
      privateKey: normalizeFirebasePrivateKey(privateKey),
    };
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizeFirebasePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
}
