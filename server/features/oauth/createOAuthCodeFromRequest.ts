import { Request, Response } from "express";
import { verifyFirebaseIdToken } from "../auth/verifyFirebaseIdToken";
import { createOAuthCode } from "./createOAuthCode";
import { getCustomGptOAuthConfig } from "./getCustomGptOAuthConfig";
import { normalizeOAuthRedirectUri } from "./normalizeOAuthRedirectUri";

export async function createOAuthCodeFromRequest(req: Request, res: Response) {
  const { clientId, redirectUri, state, scope, firebaseIdToken } = req.body || {};
  const config = getCustomGptOAuthConfig();
  const normalizedRedirectUri = normalizeOAuthRedirectUri(String(redirectUri || ""));

  if (clientId !== config.clientId) {
    return res.status(400).json({ error: "Invalid OAuth client_id." });
  }

  if (!normalizedRedirectUri || !firebaseIdToken || typeof firebaseIdToken !== "string") {
    return res.status(400).json({ error: "Missing OAuth authorization fields." });
  }

  try {
    const decodedToken = await verifyFirebaseIdToken(firebaseIdToken) as { uid?: string };
    if (!decodedToken.uid) {
      return res.status(401).json({ error: "Invalid Firebase user." });
    }

    const code = await createOAuthCode({
      firebaseIdToken,
      uid: decodedToken.uid,
      clientId,
      redirectUri: normalizedRedirectUri,
      scope: typeof scope === "string" ? scope : config.defaultScope,
    });
    const redirectUrl = new URL(normalizedRedirectUri);
    redirectUrl.searchParams.set("code", code);
    if (state) {
      redirectUrl.searchParams.set("state", String(state));
    }

    res.json({ redirectUrl: redirectUrl.toString() });
  } catch (error) {
    console.error("OAuth authorization failed:", error);
    res.status(401).json({ error: "OAuth authorization failed." });
  }
}
