import { Request, Response } from "express";
import { FirebaseRequestUser } from "./FirebaseRequestUser";
import { getFirebaseUserFromRequest } from "./getFirebaseUserFromRequest";

export function loadRequiredFirebaseUserFromRequest(req: Request, res: Response): FirebaseRequestUser | null {
  const firebaseUser = getFirebaseUserFromRequest(req);

  if (!firebaseUser) {
    res.status(401).json({ error: "Missing Firebase user context." });
    return null;
  }

  return firebaseUser;
}
