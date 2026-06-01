import { fetchGmailMessageDetail, GmailMessageDetail } from "./fetchGmailMessageDetail";
import { createGmailMessagesSearchUrl } from "./createGmailMessagesSearchUrl";
import { GmailSearchDateRange } from "./GmailSearchDateRange";
import { getGmailRequestHeaders } from "./getGmailRequestHeaders";

export async function fetchGmailEmailsBySubject(
  token: string,
  subject: string,
  maxResults = 20,
  dateRange: GmailSearchDateRange = {},
): Promise<GmailMessageDetail[]> {
  const pageSize = Math.min(maxResults, 500);
  const messages: any[] = [];
  let pageToken: string | undefined;

  do {
    const searchUrl = createGmailMessagesSearchUrl(subject, Math.min(pageSize, maxResults - messages.length), dateRange, pageToken);
    const searchResponse = await fetch(searchUrl, {
      headers: getGmailRequestHeaders(token),
    });

    if (!searchResponse.ok) {
      const details = await searchResponse.text();
      throw new Error(`Gmail query failed (HTTP ${searchResponse.status}): ${details}`);
    }

    const searchData = await searchResponse.json();
    messages.push(...(searchData.messages || []));
    pageToken = searchData.nextPageToken;
  } while (pageToken && messages.length < maxResults);

  if (messages.length === 0) {
    return [];
  }

  const emailDetails = await Promise.all(
    messages.map((message: any) => fetchGmailMessageDetail(token, message.id)),
  );

  return emailDetails.filter((email): email is GmailMessageDetail => Boolean(email));
}
