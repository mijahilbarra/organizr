export function toggleStringSetValue(currentSet: Set<string>, value: string): Set<string> {
  const nextSet = new Set(currentSet);

  if (nextSet.has(value)) {
    nextSet.delete(value);
  } else {
    nextSet.add(value);
  }

  return nextSet;
}
