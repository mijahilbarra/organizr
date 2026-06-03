export function createConsumeMonthKey(dateValue: string | undefined): string {
  if (!dateValue) {
    return "No date";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "No date";
  }

  return parsedDate.toISOString().slice(0, 7);
}
