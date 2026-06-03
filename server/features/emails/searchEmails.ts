import { Request, Response } from "express";
import { getPersistedGmailAccessToken } from "../auth/getPersistedGmailAccessToken";
import { fetchGmailEmailsBySubject } from "./fetchGmailEmailsBySubject";

/**
 * Searches the user's Gmail box, retrieves the list of matching message stubs,
 * and fetches the detailed content of the top matches in parallel.
 */
export async function searchEmails(req: Request, res: Response) {
  const token = await getPersistedGmailAccessToken(req);
  const subject = req.query.subject as string;

  if (!token) {
    return res.status(401).json({ error: "Connect Gmail before searching messages. Stored Gmail access is short-lived and must be renewed after it expires." });
  }

  if (!subject) {
    return res.status(400).json({ error: "Subject parameter is required." });
  }

  try {
    console.log(`[Gmail Crawler] Intending to search subject: ${subject}`);
    console.log(`[Gmail Crawler] OAuth Token present? ${!!token} Length: ${token?.length}`);

    const emails = await fetchGmailEmailsBySubject(token, subject, 3);

    if (emails.length === 0) {
      console.log(`[Gmail Crawler] Found 0 candidate messages for query.`);
      return res.json({ emails: [] });
    }

    console.log(`[Gmail Crawler] Loaded details successfully for ${emails.length} emails.`);
    res.json({ emails });
  } catch (error: any) {
    console.error("Gmail crawler lookup breakdown:", error);
    res.status(200).json({ error: error.message || "Unknown Gmail fetch error" });
  }
}
