import { UserProfile } from "../../types";
import { getUserProfileDocument } from "./getUserProfileDocument";
import { normalizeFirestoreUserProfile } from "./normalizeFirestoreUserProfile";

export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  const profileDocument = await getUserProfileDocument(userId);
  const snapshot = await profileDocument.get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeFirestoreUserProfile(profileDocument.id, snapshot.data());
}
