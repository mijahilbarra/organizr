import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import type { FirebaseAuthSession } from "./FirebaseAuthSession";
import { getFirebaseAuth } from "./getFirebaseAuth";

export const signInWithGoogle = async (): Promise<FirebaseAuthSession> => {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
  provider.setCustomParameters({
    prompt: "select_account consent",
  });

  const result = await signInWithPopup(getFirebaseAuth(), provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const firebaseIdToken = await result.user.getIdToken();

  return {
    user: result.user,
    firebaseIdToken,
    gmailAccessToken: credential?.accessToken || null,
  };
};
