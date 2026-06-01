import path from "path";
import dotenv from "dotenv";
import type { TicketState, TicketUrgency } from "../src/types";
import { ticketStateOptions } from "../src/features/tickets/ticketStateOptions";
import { createCodexTicket } from "../server/features/tickets/createCodexTicket";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const args = process.argv.slice(2);
const descriptionIndex = args.indexOf("--description");
const urgencyIndex = args.indexOf("--urgency");
const stateIndex = args.indexOf("--state");
const validStates = ticketStateOptions.map((option) => option.value);
const description = descriptionIndex >= 0 ? args[descriptionIndex + 1]?.trim() : "";
const urgency = urgencyIndex >= 0 ? Number(args[urgencyIndex + 1]) as TicketUrgency : 3;
const state = stateIndex >= 0 ? args[stateIndex + 1] as TicketState : "backlog";

if (!description) {
  console.error('Usage: npm run tickets:create -- --description "Fix issue" --urgency 3 --state todo');
  process.exit(1);
}

if (![1, 2, 3, 4, 5].includes(urgency)) {
  console.error("Invalid --urgency. Use a number from 1 to 5.");
  process.exit(1);
}

if (!validStates.includes(state)) {
  console.error(`Invalid --state. Use one of: ${validStates.join(", ")}`);
  process.exit(1);
}

const id = await createCodexTicket({ description, urgency, state });

console.log(JSON.stringify({ id, description, urgency, state, user: "codex" }, null, 2));
