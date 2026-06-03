import { Request, Response } from "express";
import { loadRequiredFirebaseUserFromRequest } from "../auth/loadRequiredFirebaseUserFromRequest";
import { createGptActionResponse } from "./createGptActionResponse";
import { createCodexTicket } from "../tickets/createCodexTicket";
import { ticketStateOptions } from "../../../src/features/tickets/ticketStateOptions";
import type { TicketState, TicketUrgency } from "../../../src/types";

export async function createGptTicket(req: Request, res: Response) {
  const firebaseUser = loadRequiredFirebaseUserFromRequest(req, res);
  if (!firebaseUser) return;

  const description = String(req.body?.description || "").trim();
  const urgency = Number(req.body?.urgency || 3) as TicketUrgency;
  const state = String(req.body?.state || "backlog") as TicketState;
  const validStates = ticketStateOptions.map((option) => option.value);

  if (!description) {
    return res.status(400).json(createGptActionResponse("TICKET_DESCRIPTION_REQUIRED", "Provide a ticket description.", {}));
  }

  if (![1, 2, 3, 4, 5].includes(urgency)) {
    return res.status(400).json(createGptActionResponse("UNEXPECTED_ERROR", "Invalid urgency. Use a value from 1 to 5.", {}));
  }

  if (!validStates.includes(state)) {
    return res.status(400).json(createGptActionResponse("UNEXPECTED_ERROR", `Invalid state. Use one of: ${validStates.join(", ")}`, {}));
  }

  try {
    const id = await createCodexTicket({ description, urgency, state });
    const ticket = {
      id,
      description,
      urgency,
      state,
      user: "codex",
      userId: "codex",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return res.json(createGptActionResponse("READY", "Ticket created.", {
      ticket,
    }));
  } catch (error: any) {
    console.error("Create GPT ticket breakdown:", error);
    return res.status(500).json(createGptActionResponse("UNEXPECTED_ERROR", error.message || "Failed to create ticket.", {}));
  }
}
