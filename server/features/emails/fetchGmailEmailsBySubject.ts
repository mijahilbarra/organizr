import { fetchGmailMessageDetail, GmailMessageDetail } from "./fetchGmailMessageDetail";
import { getGmailRequestHeaders } from "./getGmailRequestHeaders";

export async function fetchGmailEmailsBySubject(
  token: string,
  subject: string,
  maxResults = 20,
): Promise<GmailMessageDetail[]> {
  const query = `subject:"${subject}"`;
  const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  const searchResponse = await fetch(searchUrl, {
    headers: getGmailRequestHeaders(token),
  });

  if (!searchResponse.ok) {
    const details = await searchResponse.text();
    throw new Error(`Gmail query failed (HTTP ${searchResponse.status}): ${details}`);
  }

  const searchData = await searchResponse.json();
  const messages = searchData.messages || [];

  if (messages.length === 0) {
    return [];
  }

  const emailDetails = await Promise.all(
    messages.map((message: any) => fetchGmailMessageDetail(token, message.id)),
  );

  return emailDetails.filter((email): email is GmailMessageDetail => Boolean(email));
}
