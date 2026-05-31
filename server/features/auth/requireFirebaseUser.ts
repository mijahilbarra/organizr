import { NextFunction, Request, Response } from "express";
import { getFirebaseIdTokenFromRequest } from "./getFirebaseIdTokenFromRequest";
import { verifyFirebaseIdToken } from "./verifyFirebaseIdToken";

export async function requireFirebaseUser(req: Request, res: Response, next: NextFunction) {
  const idToken = getFirebaseIdTokenFromRequest(req);

  if (!idToken) {
    return res.status(401).json({ error: "Missing Firebase authorization token." });
  }

  try {
    (req as Request & { firebaseUser?: unknown }).firebaseUser = await verifyFirebaseIdToken(idToken);
    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    res.status(401).json({ error: "Invalid or expired Firebase authorization token." });
  }
}
