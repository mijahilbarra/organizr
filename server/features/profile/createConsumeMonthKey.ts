export function createConsumeMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}
