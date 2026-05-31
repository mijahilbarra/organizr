import { getFirestoreDb } from "../firebase/getFirestoreDb";

type FirestoreDocumentRef = {
  get: () => Promise<{
    exists: boolean;
    data: () => FirebaseFirestoreDbDocument | undefined;
  }>;
  set: (data: FirebaseFirestoreDbDocument, options?: { merge: boolean }) => Promise<unknown>;
};

interface FirebaseFirestoreDbDocument {
  extractors?: unknown;
  updatedAt?: string;
}

export async function getFirestoreDbDocument(): Promise<FirestoreDocumentRef> {
  const firestoreDb = await getFirestoreDb();
  const collectionName = process.env.FIRESTORE_DB_COLLECTION || "organizr";
  const documentId = process.env.FIRESTORE_DB_DOCUMENT_ID || "database";

  return firestoreDb.collection(collectionName).doc(documentId) as FirestoreDocumentRef;
}
