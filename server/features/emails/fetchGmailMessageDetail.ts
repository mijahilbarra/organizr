import { getEmailBody } from "./getEmailBody";
import { getEmailHeaderValue } from "./getEmailHeaderValue";
import { getGmailRequestHeaders } from "./getGmailRequestHeaders";

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
}

export async function fetchGmailMessageDetail(token: string, messageId: string): Promise<GmailMessageDetail | null> {
  const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
  const detailResponse = await fetch(detailUrl, {
    headers: getGmailRequestHeaders(token),
  });

  if (!detailResponse.ok) {
    console.error(`[Gmail Crawler] Detail fetch failed for message ${messageId}: status ${detailResponse.status}`);
    return null;
  }

  const emailDetail = await detailResponse.json();
  const headers = emailDetail.payload?.headers || [];

  return {
    id: emailDetail.id,
    threadId: emailDetail.threadId,
    subject: getEmailHeaderValue(headers, "subject", "No Subject"),
    from: getEmailHeaderValue(headers, "from", "Unknown Sender"),
    date: getEmailHeaderValue(headers, "date", ""),
    snippet: emailDetail.snippet || "",
    body: getEmailBody(emailDetail.payload),
  };
}
