/**
 * JSON.stringify with object keys sorted recursively, so two semantically
 * equal objects always serialize identically. Firestore returns map keys in
 * sorted order while local state keeps insertion order — comparing plain
 * JSON strings would treat every server echo of our own write as a change.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value))
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
    )
  }
  return value
}
