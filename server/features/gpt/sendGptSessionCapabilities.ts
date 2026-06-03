import { Request, Response } from "express";
import { loadUserProfileForRequest } from "../profile/loadUserProfileForRequest";
import { createGptActionResponse } from "./createGptActionResponse";
import { createGptCapabilities } from "./createGptCapabilities";

export async function sendGptSessionCapabilities(req: Request, res: Response) {
  const loaded = await loadUserProfileForRequest(req);
  const capabilities = createGptCapabilities(loaded?.profile || null);
  const code = capabilities.authenticated && capabilities.gmailConnected && capabilities.llmAvailable
    ? "READY"
    : !capabilities.authenticated
      ? "AUTH_REQUIRED"
      : !capabilities.gmailConnected
        ? "GMAIL_CONNECTION_REQUIRED"
        : "LLM_PROVIDER_REQUIRED";

  res.status(code === "READY" ? 200 : 409).json(createGptActionResponse(
    code,
    code === "READY" ? "Custom GPT actions are ready for this user." : "Custom GPT actions need user setup before running.",
    { capabilities },
  ));
}
