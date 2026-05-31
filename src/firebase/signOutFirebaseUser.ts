import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "./getFirebaseAuth";

export const signOutFirebaseUser = async (): Promise<void> => {
  await signOut(getFirebaseAuth());
};
