import type { TicketState, TicketUrgency } from "../../../src/types";
import { getFirestoreServerTimestamp } from "./getFirestoreServerTimestamp";
import { getTicketsCollection } from "./getTicketsCollection";

interface CreateCodexTicketInput {
  description: string;
  urgency: TicketUrgency;
  state: TicketState;
}

export async function createCodexTicket(input: CreateCodexTicketInput): Promise<string> {
  const ticketsCollection = await getTicketsCollection();
  const timestamp = await getFirestoreServerTimestamp();
  const ticketDoc = await ticketsCollection.add({
    description: input.description,
    urgency: input.urgency,
    state: input.state,
    user: "codex",
    userId: "codex",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return ticketDoc.id;
}
