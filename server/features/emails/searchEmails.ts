import { Request, Response } from "express";
import { getGmailAccessTokenFromRequest } from "../auth/getGmailAccessTokenFromRequest";
import { fetchGmailMessageDetail } from "./fetchGmailMessageDetail";
import { getGmailRequestHeaders } from "./getGmailRequestHeaders";

/**
 * Searches the user's Gmail box, retrieves the list of matching message stubs,
 * and fetches the detailed content of the top matches in parallel.
 */
export async function searchEmails(req: Request, res: Response) {
  const token = getGmailAccessTokenFromRequest(req);
  const subject = req.query.subject as string;

  if (!token) {
    return res.status(401).json({ error: "Missing OAuth access token." });
  }

  if (!subject) {
    return res.status(400).json({ error: "Subject parameter is required." });
  }

  try {
    const query = `subject:"${subject}"`;
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`;

    console.log(`[Gmail Crawler] Intending to search: ${query}`);
    console.log(`[Gmail Crawler] URL: ${searchUrl}`);
    console.log(`[Gmail Crawler] OAuth Token present? ${!!token} Length: ${token?.length}`);

    const searchResponse = await fetch(searchUrl, {
      headers: getGmailRequestHeaders(token),
    });

    console.log(`[Gmail Crawler] Response status: ${searchResponse.status} ${searchResponse.statusText}`);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`[Gmail Crawler] API error body output:\n${errorText}`);
      
      // Use 200 OK with JSON error payload so the frontend always receives parseable details.
      return res.status(200).json({ 
        error: `Gmail Search REST Error (HTTP ${searchResponse.status}): ${errorText || "No response details."}. Is the Gmail API enabled in your Google Developers Console Project?` 
      });
    }

    const contentType = searchResponse.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await searchResponse.text();
      console.error(`[Gmail Crawler] Non-JSON API response body:\n${text}`);
      return res.status(200).json({ 
        error: `Gmail API returned a non-JSON status ${searchResponse.status} response: ${text.substring(0, 300)}` 
      });
    }

    const searchData = await searchResponse.json();
    const messages = searchData.messages || [];

    if (messages.length === 0) {
      console.log(`[Gmail Crawler] Found 0 candidate messages for query.`);
      return res.json({ emails: [] });
    }

    console.log(`[Gmail Crawler] Found ${messages.length} messages. Fetching email details...`);

    // Parallel fetch contents for each candidate email
    const emailPromises = messages.map(async (msg: any) => {
      try {
        return await fetchGmailMessageDetail(token, msg.id);
      } catch (err) {
        console.error(`Error querying detail for message ${msg.id}:`, err);
        return null;
      }
    });

    const emails = (await Promise.all(emailPromises)).filter(Boolean);
    console.log(`[Gmail Crawler] Loaded details successfully for ${emails.length} emails.`);
    res.json({ emails });
  } catch (error: any) {
    console.error("Gmail crawler lookup breakdown:", error);
    res.status(200).json({ error: error.message || "Unknown Gmail fetch error" });
  }
}
