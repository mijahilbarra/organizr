import { UserProfile } from "../../types";
import { getUserProfileDocument } from "./getUserProfileDocument";

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const profileDocument = await getUserProfileDocument(profile.uid);
  await profileDocument.set(profile, { merge: false });
}
