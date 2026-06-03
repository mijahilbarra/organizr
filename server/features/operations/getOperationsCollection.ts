import { getFirestoreDb } from "../../firebase/getFirestoreDb";

export type OperationDocumentSnapshot = {
  id: string;
  exists: boolean;
  data: () => unknown;
};

export type OperationsCollectionRef = {
  doc: (documentPath: string) => {
    id: string;
    get: () => Promise<OperationDocumentSnapshot>;
    create: (data: unknown) => Promise<unknown>;
    set?: (data: unknown, options?: unknown) => Promise<unknown>;
    update?: (data: unknown) => Promise<unknown>;
  };
  where: (fieldPath: string, operator: "==", value: string) => OperationsCollectionRef;
  orderBy: (fieldPath: string, directionStr: "asc" | "desc") => OperationsCollectionRef;
  limit: (limit: number) => OperationsCollectionRef;
  offset: (offset: number) => OperationsCollectionRef;
  startAfter: (fieldValue: string) => OperationsCollectionRef;
  get: () => Promise<{ docs: OperationDocumentSnapshot[] }>;
};

export async function getOperationsCollection(): Promise<OperationsCollectionRef> {
  const firestoreDb = await getFirestoreDb();
  const collectionName = process.env.FIRESTORE_OPERATIONS_COLLECTION || "operations";

  return firestoreDb.collection(collectionName) as OperationsCollectionRef;
}
