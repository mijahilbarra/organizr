import { onIdTokenChanged } from "firebase/auth";
import type { Unsubscribe } from "firebase/auth";
import type { FirebaseAuthSession } from "./FirebaseAuthSession";
import { getFirebaseAuth } from "./getFirebaseAuth";

export const subscribeToFirebaseUser = (
  onSession: (session: FirebaseAuthSession | null) => void
): Unsubscribe => {
  return onIdTokenChanged(getFirebaseAuth(), async (user) => {
    if (!user) {
      onSession(null);
      return;
    }

    onSession({
      user,
      firebaseIdToken: await user.getIdToken(),
      gmailAccessToken: null,
      gmailAccessTokenExpiresInSeconds: null,
    });
  });
};
