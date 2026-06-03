export function findValidationEmailBySubject(emails: any[], subject: string) {
  return emails.find((entry: any) =>
    String(entry?.subject || "").trim().toLowerCase() === subject.toLowerCase(),
  ) || emails[0];
}
