export function normalizeJsonSchemaTypes(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeJsonSchemaTypes);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (key === "type" && typeof entry === "string") {
        return [key, entry.toLowerCase()];
      }

      return [key, normalizeJsonSchemaTypes(entry)];
    }),
  );
}
