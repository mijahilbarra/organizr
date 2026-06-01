import { getFirestoreDb } from "../../firebase/getFirestoreDb";

type TicketQuerySnapshot = {
  docs: Array<{
    id: string;
    data: () => unknown;
  }>;
};

export type TicketDocumentRef = {
  set: (data: unknown, options?: { merge: boolean }) => Promise<unknown>;
  delete: () => Promise<unknown>;
};

export type TicketsCollectionRef = {
  add: (data: unknown) => Promise<{ id: string }>;
  doc: (documentPath: string) => TicketDocumentRef;
  get: () => Promise<TicketQuerySnapshot>;
  orderBy: (fieldPath: string, directionStr: "asc" | "desc") => {
    get: () => Promise<TicketQuerySnapshot>;
  };
};

export async function getTicketsCollection(): Promise<TicketsCollectionRef> {
  const firestoreDb = await getFirestoreDb();

  return firestoreDb.collection("tickets") as TicketsCollectionRef;
}
