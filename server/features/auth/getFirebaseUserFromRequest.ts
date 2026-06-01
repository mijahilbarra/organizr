import { Request } from "express";
import { FirebaseRequestUser } from "./FirebaseRequestUser";

export function getFirebaseUserFromRequest(req: Request): FirebaseRequestUser | null {
  const firebaseUser = (req as Request & { firebaseUser?: FirebaseRequestUser }).firebaseUser;

  if (!firebaseUser?.uid) {
    return null;
  }

  return firebaseUser;
}
