import { buildGmailSubjectSearchQuery } from "./buildGmailSubjectSearchQuery";
import { GmailSearchDateRange } from "./GmailSearchDateRange";

export function createGmailMessagesSearchUrl(
  subject: string,
  pageSize: number,
  dateRange: GmailSearchDateRange = {},
  pageToken?: string,
): string {
  const params = new URLSearchParams({
    q: buildGmailSubjectSearchQuery(subject, dateRange),
    maxResults: String(pageSize),
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  return `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;
}
