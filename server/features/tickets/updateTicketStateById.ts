import type { TicketState } from "../../../src/types";
import { getFirestoreServerTimestamp } from "./getFirestoreServerTimestamp";
import { getTicketsCollection } from "./getTicketsCollection";

export async function updateTicketStateById(id: string, state: TicketState): Promise<void> {
  const ticketsCollection = await getTicketsCollection();
  const ticketDocument = ticketsCollection.doc(id);

  await ticketDocument.set({ state, updatedAt: await getFirestoreServerTimestamp() }, { merge: true });
}
