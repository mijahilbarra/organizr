import { GmailConnection } from "../../types";

export function isGmailConnectionActive(connection: GmailConnection | null): boolean {
  if (!connection || connection.revokedAt) {
    return false;
  }

  return new Date(connection.expiresAt).getTime() > Date.now();
}
