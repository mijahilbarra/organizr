import { UserProfile } from "../../types";
import { FirebaseRequestUser } from "../auth/FirebaseRequestUser";

export function createUserProfileFromFirebaseUser(firebaseUser: FirebaseRequestUser): UserProfile {
  const now = new Date().toISOString();

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.name || "",
    photoURL: firebaseUser.picture || "",
    createdAt: now,
    updatedAt: now,
    gmailConnection: null,
    llmConsumeByMonth: {},
    llmSettings: {
      defaultProvider: "auto",
    },
  };
}
