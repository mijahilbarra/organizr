import type { TicketState } from "../../types";

export const ticketStateOptions: Array<{ value: TicketState; label: string }> = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To do" },
  { value: "doing", label: "Doing" },
  { value: "onreview", label: "On review" },
  { value: "done", label: "Done" },
];
