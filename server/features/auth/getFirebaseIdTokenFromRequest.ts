import { Request } from "express";

export function getFirebaseIdTokenFromRequest(req: Request): string {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.replace("Bearer ", "").trim();
}
