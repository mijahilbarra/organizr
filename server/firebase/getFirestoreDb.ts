import { getFirebaseAdminApp } from "./getFirebaseAdminApp";

type FirestoreDb = {
  collection: (collectionPath: string) => {
    doc: (documentPath: string) => unknown;
  };
  settings?: (settings: { ignoreUndefinedProperties: boolean }) => void;
};

let cachedFirestoreDb: FirestoreDb | null = null;

export async function getFirestoreDb(): Promise<FirestoreDb> {
  if (cachedFirestoreDb) {
    return cachedFirestoreDb;
  }

  const firebaseAdminApp = await getFirebaseAdminApp();
  const firestorePackage = "firebase-admin/firestore";
  const firestoreModule = await import(firestorePackage);
  const databaseId = process.env.FIRESTORE_DATABASE_ID || "default";
  const firestoreDb = firestoreModule.getFirestore(firebaseAdminApp, databaseId) as FirestoreDb;

  firestoreDb.settings?.({ ignoreUndefinedProperties: true });
  cachedFirestoreDb = firestoreDb;

  return firestoreDb;
}
