import { getFirebaseServiceAccount } from "./getFirebaseServiceAccount";

type FirebaseAdminApp = unknown;

export async function getFirebaseAdminApp(): Promise<FirebaseAdminApp> {
  const firebaseAdminAppPackage = "firebase-admin/app";
  const firebaseAdminAppModule = await import(firebaseAdminAppPackage);
  const { cert, getApps, initializeApp } = firebaseAdminAppModule;
  const existingApps = getApps();

  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const serviceAccount = getFirebaseServiceAccount();

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  }

  return initializeApp();
}
