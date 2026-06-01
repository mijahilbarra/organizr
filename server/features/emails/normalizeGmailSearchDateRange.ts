import { GmailSearchDateRange } from "./GmailSearchDateRange";

function normalizeDateValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("Extraction dates must use YYYY-MM-DD format.");
  }

  const parsedDate = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== trimmed) {
    throw new Error("Extraction dates must be valid calendar dates.");
  }

  return trimmed;
}

export function normalizeGmailSearchDateRange(source: { after?: unknown; before?: unknown }): GmailSearchDateRange {
  const after = normalizeDateValue(source.after);
  const before = normalizeDateValue(source.before);

  if (after && before && after > before) {
    throw new Error("Extraction start date cannot be after the end date.");
  }

  return { after, before };
}
