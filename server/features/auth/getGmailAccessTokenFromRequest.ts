import { Request } from "express";

export function getGmailAccessTokenFromRequest(req: Request): string {
  return (req.headers["x-gmail-token"] as string) || "";
}
