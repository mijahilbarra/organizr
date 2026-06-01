import { Request } from "express";
import { UserProfile } from "../../types";
import { getFirebaseUserFromRequest } from "../auth/getFirebaseUserFromRequest";
import { createUserProfileFromFirebaseUser } from "./createUserProfileFromFirebaseUser";
import { getUserProfileById } from "./getUserProfileById";
import { saveUserProfile } from "./saveUserProfile";

export async function loadUserProfileForRequest(req: Request): Promise<{
  profile: UserProfile;
} | null> {
  const firebaseUser = getFirebaseUserFromRequest(req);

  if (!firebaseUser) {
    return null;
  }

  const existingProfile = await getUserProfileById(firebaseUser.uid);

  if (existingProfile) {
    return { profile: existingProfile };
  }

  const profile = createUserProfileFromFirebaseUser(firebaseUser);
  await saveUserProfile(profile);

  return { profile };
}
