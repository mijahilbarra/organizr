import type { Ticket, TicketState, TicketUrgency } from "../../types";

const ticketStates: TicketState[] = ["backlog", "todo", "doing", "onreview", "done"];
const ticketUrgencies: TicketUrgency[] = [1, 2, 3, 4, 5];

const normalizeFirestoreDate = (value: unknown): string => {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return typeof value === "string" ? value : "";
};

export const normalizeFirestoreTicket = (id: string, data: unknown): Ticket => {
  const source = data && typeof data === "object" ? data as Partial<Ticket> : {};
  const urgency = ticketUrgencies.includes(source.urgency as TicketUrgency) ? source.urgency as TicketUrgency : 3;
  const state = ticketStates.includes(source.state as TicketState) ? source.state as TicketState : "backlog";

  return {
    id,
    description: source.description || "",
    urgency,
    state,
    user: source.user || "codex",
    userId: source.userId || "",
    createdAt: normalizeFirestoreDate(source.createdAt),
    updatedAt: normalizeFirestoreDate(source.updatedAt),
  };
};
