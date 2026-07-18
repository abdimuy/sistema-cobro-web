// normalizeText lowercases and strips diacritics so client-side search is
// accent-insensitive ("moreLIA" matches "MORELIA", "sanchez" matches
// "SÁNCHEZ").
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// matchesSearch returns true when the query is blank, or when any of the
// given haystacks contains the (normalized) query as a substring.
export function matchesSearch(haystacks: ReadonlyArray<string | null | undefined>, query: string): boolean {
  const q = normalizeText(query.trim());
  if (!q) return true;
  return haystacks.some((h) => !!h && normalizeText(h).includes(q));
}
