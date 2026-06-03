import { collection } from "firebase/firestore";
import type { CollectionReference, DocumentData } from "firebase/firestore";
import { getFirestoreDatabase } from "../../firebase/getFirestoreDatabase";

export const getOperationsCollection = (): CollectionReference<DocumentData> => {
  return collection(getFirestoreDatabase(), "operations");
};
