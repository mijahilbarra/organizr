import type { Ticket, TicketState } from "../../../src/types";
import { normalizeFirestoreTicket } from "../../../src/features/tickets/normalizeFirestoreTicket";
import { getTicketsCollection } from "./getTicketsCollection";

export async function listTicketsForCodex(state?: TicketState): Promise<Ticket[]> {
  const ticketsCollection = await getTicketsCollection();
  const snapshot = await ticketsCollection.orderBy("createdAt", "desc").get();
  const tickets = snapshot.docs.map((doc) => normalizeFirestoreTicket(doc.id, doc.data()));

  return state ? tickets.filter((ticket) => ticket.state === state) : tickets;
}
