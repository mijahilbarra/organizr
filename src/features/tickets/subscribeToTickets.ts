import { onSnapshot, orderBy, query } from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import type { Ticket } from "../../types";
import { getTicketsCollection } from "./getTicketsCollection";
import { normalizeFirestoreTicket } from "./normalizeFirestoreTicket";

export const subscribeToTickets = (onTickets: (tickets: Ticket[]) => void, onError: (error: Error) => void): Unsubscribe => {
  const ticketsQuery = query(getTicketsCollection(), orderBy("createdAt", "desc"));

  return onSnapshot(
    ticketsQuery,
    (snapshot) => {
      onTickets(snapshot.docs.map((doc) => normalizeFirestoreTicket(doc.id, doc.data())));
    },
    onError,
  );
};
