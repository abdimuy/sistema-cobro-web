// clientesViewCache — in-memory, session-scoped cache for the clientes directory
// view. It lets the directory survive a round-trip to a client's ficha and back
// without re-fetching or losing scroll position.
//
// Keyed by the filter signature (the URL query string), each entry holds the
// accumulated pages, the pagination cursor, the facets, and the table's scroll
// position. The cache is a module singleton: it survives component unmount (the
// expected navigation flow) but NOT a full page reload — a reload should refetch
// fresh data, and the filters live in the URL so they are restored regardless.

import type { Cliente } from "../domain/entities";
import type { DirectorioFacets } from "../application/dto";

export type ClientesViewEntry = {
  items: ReadonlyArray<Cliente>;
  nextCursor: string;
  facets: DirectorioFacets;
  scrollTop: number;
};

const views = new Map<string, ClientesViewEntry>();

export function getView(key: string): ClientesViewEntry | undefined {
  return views.get(key);
}

export function setView(key: string, entry: ClientesViewEntry): void {
  views.set(key, entry);
}

// patchView merges a partial update into an existing entry (or seeds an empty one).
// Used to update scrollTop without clobbering data, and data without clobbering scroll.
export function patchView(key: string, patch: Partial<ClientesViewEntry>): void {
  const current = views.get(key);
  views.set(key, {
    items: [],
    nextCursor: "",
    facets: {},
    scrollTop: 0,
    ...current,
    ...patch,
  });
}

export function clearView(key: string): void {
  views.delete(key);
}

// resetClientesViewCache clears every entry — for test isolation (the cache is a
// module singleton, so it would otherwise leak between tests).
export function resetClientesViewCache(): void {
  views.clear();
}

// ── Last directory URL (path + query) for the "volver" link in the ficha ──────
// Stored in sessionStorage so it survives a reload of the ficha page too.

const LAST_URL_KEY = "clientes:lastUrl";

export function setLastClientesUrl(url: string): void {
  try {
    sessionStorage.setItem(LAST_URL_KEY, url);
  } catch {
    // sessionStorage unavailable (private mode / SSR) — degrade silently.
  }
}

export function getLastClientesUrl(): string | null {
  try {
    return sessionStorage.getItem(LAST_URL_KEY);
  } catch {
    return null;
  }
}
