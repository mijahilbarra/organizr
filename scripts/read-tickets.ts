import path from "path";
import dotenv from "dotenv";
import type { TicketState } from "../src/types";
import { ticketStateOptions } from "../src/features/tickets/ticketStateOptions";
import { listTicketsForCodex } from "../server/features/tickets/listTicketsForCodex";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const args = process.argv.slice(2);
const stateIndex = args.indexOf("--state");
const jsonOutput = args.includes("--json");
const requestedState = stateIndex >= 0 ? args[stateIndex + 1] as TicketState | undefined : undefined;
const validStates = ticketStateOptions.map((option) => option.value);

if (requestedState && !validStates.includes(requestedState)) {
  console.error(`Invalid --state. Use one of: ${validStates.join(", ")}`);
  process.exit(1);
}

const tickets = await listTicketsForCodex(requestedState);

if (jsonOutput) {
  console.log(JSON.stringify({ tickets }, null, 2));
} else {
  const groups = ticketStateOptions.map((option) => ({
    ...option,
    tickets: tickets.filter((ticket) => ticket.state === option.value),
  }));

  for (const group of groups) {
    if (requestedState && group.value !== requestedState) continue;
    console.log(`\n${group.label} (${group.tickets.length})`);
    for (const ticket of group.tickets) {
      console.log(`- ${ticket.id} | U${ticket.urgency} | ${ticket.user} | ${ticket.description}`);
    }
  }
}
