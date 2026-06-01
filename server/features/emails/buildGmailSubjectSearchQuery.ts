import { GmailSearchDateRange } from "./GmailSearchDateRange";

export function buildGmailSubjectSearchQuery(subject: string, dateRange: GmailSearchDateRange = {}): string {
  const queryParts = [`subject:"${subject.replace(/"/g, '\\"')}"`];

  if (dateRange.after) {
    queryParts.push(`after:${dateRange.after}`);
  }

  if (dateRange.before) {
    queryParts.push(`before:${dateRange.before}`);
  }

  return queryParts.join(" ");
}
