import { getFirestoreDb } from "../../firebase/getFirestoreDb";

type FirestoreDocumentSnapshot = {
  exists: boolean;
  data: () => unknown;
};

export type UserProfileDocumentRef = {
  id: string;
  get: () => Promise<FirestoreDocumentSnapshot>;
  set: (data: unknown, options?: { merge: boolean }) => Promise<unknown>;
};

type UsersCollectionRef = {
  doc: (documentPath: string) => UserProfileDocumentRef;
};

export async function getUsersCollection(): Promise<UsersCollectionRef> {
  const firestoreDb = await getFirestoreDb();
  const collectionName = process.env.FIRESTORE_USERS_COLLECTION || "users";

  return firestoreDb.collection(collectionName) as UsersCollectionRef;
}
