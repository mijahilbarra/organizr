import { Request, Response } from "express";
import { consumeOAuthCode } from "./consumeOAuthCode";
import { getCustomGptOAuthConfig } from "./getCustomGptOAuthConfig";
import { normalizeOAuthRedirectUri } from "./normalizeOAuthRedirectUri";

function readBasicAuth(req: Request) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return null;

  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex < 0) return null;

  return {
    clientId: decoded.slice(0, separatorIndex),
    clientSecret: decoded.slice(separatorIndex + 1),
  };
}

export async function exchangeOAuthToken(req: Request, res: Response) {
  const basicAuth = readBasicAuth(req);
  const bodyClientId = req.body?.client_id;
  const bodyClientSecret = req.body?.client_secret;
  const clientId = basicAuth?.clientId || bodyClientId;
  const clientSecret = basicAuth?.clientSecret || bodyClientSecret;
  const code = String(req.body?.code || "");
  const redirectUri = normalizeOAuthRedirectUri(String(req.body?.redirect_uri || ""));
  const grantType = String(req.body?.grant_type || "");
  const config = getCustomGptOAuthConfig();

  if (clientId !== config.clientId || clientSecret !== config.clientSecret) {
    return res.status(401).json({ error: "invalid_client" });
  }

  if (grantType !== "authorization_code" || !code || !redirectUri) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const oauthCode = await consumeOAuthCode(code, clientId, redirectUri);
  if (!oauthCode) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  res.json({
    access_token: oauthCode.firebaseIdToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: oauthCode.scope,
  });
}
