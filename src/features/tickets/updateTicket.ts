import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { TicketState, TicketUrgency } from "../../types";
import { getTicketsCollection } from "./getTicketsCollection";

interface UpdateTicketInput {
  id: string;
  description?: string;
  urgency?: TicketUrgency;
  state?: TicketState;
}

export const updateTicket = async (input: UpdateTicketInput): Promise<void> => {
  const { id, ...updates } = input;
  await setDoc(doc(getTicketsCollection(), id), { ...updates, updatedAt: serverTimestamp() }, { merge: true });
};
