import { Request } from "express";
import { getFirebaseUserFromRequest } from "./getFirebaseUserFromRequest";
import { getGmailAccessTokenFromRequest } from "./getGmailAccessTokenFromRequest";
import { getUserProfileById } from "../profile/getUserProfileById";
import { isGmailConnectionActive } from "../profile/isGmailConnectionActive";

export async function getPersistedGmailAccessToken(req: Request): Promise<string> {
  const requestToken = getGmailAccessTokenFromRequest(req);

  if (requestToken) {
    return requestToken;
  }

  const firebaseUser = getFirebaseUserFromRequest(req);

  if (!firebaseUser) {
    return "";
  }

  const profile = await getUserProfileById(firebaseUser.uid);
  const connection = profile?.gmailConnection || null;

  if (!isGmailConnectionActive(connection)) {
    return "";
  }

  return connection.accessToken;
}
