import { getFirestoreDb } from "../../firebase/getFirestoreDb";

export type ExtractorDocumentRef = {
  id: string;
  get: () => Promise<{
    exists: boolean;
    data: () => unknown;
  }>;
  set: (data: unknown, options?: { merge: boolean }) => Promise<unknown>;
};

type FirestoreQuerySnapshot = {
  docs: Array<{
    id: string;
    exists: boolean;
    data: () => unknown;
  }>;
};

type ExtractorsCollectionRef = {
  doc: (documentPath: string) => ExtractorDocumentRef;
  where: (fieldPath: string, operator: "==", value: string) => {
    get: () => Promise<FirestoreQuerySnapshot>;
  };
};

export async function getExtractorsCollection(): Promise<ExtractorsCollectionRef> {
  const firestoreDb = await getFirestoreDb();
  const collectionName = process.env.FIRESTORE_EXTRACTORS_COLLECTION || "extractors";

  return firestoreDb.collection(collectionName) as ExtractorsCollectionRef;
}
