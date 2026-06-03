export function formatEmailSamples(emails: any[], label = "EMAIL"): string {
  return emails.map((mail, idx) => `
=== ${label} #${idx + 1} ===
ID: ${mail.id}
From: ${mail.from}
Subject: ${mail.subject}
Date: ${mail.date}
Snippet: ${mail.snippet}
Body content:
${mail.body ? mail.body.substring(0, 4000) : mail.snippet}
=============================
`).join("\n\n");
}
