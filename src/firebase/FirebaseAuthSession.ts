import type { User } from "firebase/auth";

export interface FirebaseAuthSession {
  user: User;
  firebaseIdToken: string;
  gmailAccessToken: string | null;
}
