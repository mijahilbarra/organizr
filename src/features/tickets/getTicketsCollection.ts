import { collection } from "firebase/firestore";
import type { CollectionReference, DocumentData } from "firebase/firestore";
import { getFirestoreDatabase } from "../../firebase/getFirestoreDatabase";

export const getTicketsCollection = (): CollectionReference<DocumentData> => collection(getFirestoreDatabase(), "tickets");
