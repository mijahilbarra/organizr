import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getFirebaseApp } from "./getFirebaseApp";

export const getFirestoreDatabase = (): Firestore => {
  const env = (import.meta as any).env || {};
  const databaseId = env.VITE_FIRESTORE_DATABASE_ID || "default";

  return getFirestore(getFirebaseApp(), databaseId);
};
