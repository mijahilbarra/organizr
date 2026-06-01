import path from "path";
import dotenv from "dotenv";
import type { TicketState } from "../src/types";
import { ticketStateOptions } from "../src/features/tickets/ticketStateOptions";
import { updateTicketStateById } from "../server/features/tickets/updateTicketStateById";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const args = process.argv.slice(2);
const idIndex = args.indexOf("--id");
const stateIndex = args.indexOf("--state");
const id = idIndex >= 0 ? args[idIndex + 1]?.trim() : "";
const state = stateIndex >= 0 ? args[stateIndex + 1] as TicketState | undefined : undefined;
const validStates = ticketStateOptions.map((option) => option.value);

if (!id || !state) {
  console.error("Usage: npm run tickets:update-state -- --id ticketId --state doing");
  process.exit(1);
}

if (!validStates.includes(state)) {
  console.error(`Invalid --state. Use one of: ${validStates.join(", ")}`);
  process.exit(1);
}

await updateTicketStateById(id, state);

console.log(JSON.stringify({ id, state }, null, 2));
