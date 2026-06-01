import { addDoc, serverTimestamp } from "firebase/firestore";
import type { TicketState, TicketUrgency } from "../../types";
import { getTicketsCollection } from "./getTicketsCollection";

interface CreateTicketInput {
  description: string;
  urgency: TicketUrgency;
  state: TicketState;
  user: string;
  userId: string;
}

export const createTicket = async (input: CreateTicketInput): Promise<string> => {
  const ticketDoc = await addDoc(getTicketsCollection(), {
    description: input.description,
    urgency: input.urgency,
    state: input.state,
    user: input.user,
    userId: input.userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ticketDoc.id;
};
