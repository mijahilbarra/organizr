export function getUniqueSubjectValues(values: unknown[]): string[] {
  const uniqueValues = new Map<string, string>();

  values.forEach((value) => {
    const subject = String(value || "").trim();
    if (subject) {
      uniqueValues.set(subject.toLowerCase(), subject);
    }
  });

  return Array.from(uniqueValues.values());
}
