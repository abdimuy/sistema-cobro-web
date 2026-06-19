import { useCallback, useEffect, useRef, useState } from "react";
import type { Cliente } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { buscarClientes } from "../../application/usecases/buscarClientes";
import type { BuscarClientesInput, DirectorioFacets } from "../../application/dto";
import type { SegmentoValue, EstadoPagoValue } from "../../domain/values";
import { toDomainError } from "./lib/toDomainError";
import { getView, setView, patchView, clearView } from "../clientesViewCache";

export type UseBuscarClientesReturn = {
  items: ReadonlyArray<Cliente>;
  nextCursor: string;
  facets: DirectorioFacets;
  isLoading: boolean;
  isLoadingMore: boolean;
  // isRevalidating is true while a cached view is being refreshed in the
  // background (stale-while-revalidate) — the list is already visible.
  isRevalidating: boolean;
  error: DomainError | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
};

// useBuscarClientes fetches the paginated client directory with infinite scroll.
// State accumulates pages — loadMore appends, filter change resets.
//
// IMPORTANT: deps use primitive fields (not the object reference) to avoid
// an infinite effect loop when the caller passes an inline object literal.
export function useBuscarClientes(
  filters: BuscarClientesInput = {},
  // cacheKey enables the session view-cache (survives navigation to a ficha and
  // back): when set, the first page is hydrated from cache instead of refetched,
  // and every fetch writes back. When undefined, the hook behaves statelessly.
  cacheKey?: string,
): UseBuscarClientesReturn {
  const port = useClientesPort();

  // Destructure to primitive deps — avoid object-ref re-render loop.
  const {
    q,
    zona,
    cobrador,
    conSaldo,
    segmento,
    estadoPago,
    tier,
    bandaCredito,
    scoreMin,
    sortBy,
    sortOrder,
    limit,
  } = filters;

  // Initial state is hydrated synchronously from the view-cache (if present) so
  // the first paint after returning from a ficha already has the rows — which
  // lets the table restore its scroll position without a flicker.
  // NOTE: cacheKey may be "" (no filters — the default view), which is a VALID
  // key. Guard with `!== undefined`, never truthiness, or the default list never
  // caches and scroll/position restore silently breaks.
  const initialEntry = cacheKey !== undefined ? getView(cacheKey) : undefined;
  const [items, setItems] = useState<ReadonlyArray<Cliente>>(
    () => initialEntry?.items ?? [],
  );
  const [nextCursor, setNextCursor] = useState(() => initialEntry?.nextCursor ?? "");
  // facets are captured from the first-page response and reset on filter change.
  // loadMore does not update facets — the first page facets describe the whole set.
  const [facets, setFacets] = useState<DirectorioFacets>(
    () => initialEntry?.facets ?? {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  // Tick increments to force a re-fetch on refresh().
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  // Build filter input from primitives.
  function buildInput(cursor?: string): BuscarClientesInput {
    return {
      ...(q !== undefined && { q }),
      ...(zona !== undefined && { zona }),
      ...(cobrador !== undefined && { cobrador }),
      ...(conSaldo !== undefined && { conSaldo }),
      ...(segmento !== undefined && { segmento: segmento as SegmentoValue }),
      ...(estadoPago !== undefined && { estadoPago: estadoPago as EstadoPagoValue }),
      ...(tier !== undefined && { tier }),
      ...(bandaCredito !== undefined && { bandaCredito }),
      ...(scoreMin !== undefined && { scoreMin }),
      ...(sortBy !== undefined && { sortBy }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(limit !== undefined && { limit }),
      ...(cursor !== undefined && { cursor }),
    };
  }

  // First page: hydrate from cache or fetch — triggered by filter/tick changes.
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    loadingMoreRef.current = false;

    // Cache hit → hydrate, skip the network. refresh() clears the entry first,
    // so a manual refresh falls through to the fetch below.
    const cached = cacheKey !== undefined ? getView(cacheKey) : undefined;
    if (cached) {
      // Show the cached view instantly (preserves scroll), then revalidate in the
      // background so the directory is always current. Replays the loaded pages
      // (cursor pagination caps each page at the backend limit) and replaces the
      // list in place — scroll is kept unless the data near the top changed.
      setItems(cached.items);
      setNextCursor(cached.nextCursor);
      setFacets(cached.facets);
      setIsLoading(false);
      setError(null);

      const targetCount = cached.items.length;
      loadingMoreRef.current = true; // block loadMore while revalidating
      setIsRevalidating(true);
      void (async () => {
        try {
          const acc: Cliente[] = [];
          let cursor: string | undefined = undefined;
          let lastCursor = "";
          let firstFacets: DirectorioFacets = {};
          let first = true;
          do {
            const out = await buscarClientes(port, buildInput(cursor), ctrl.signal);
            if (ctrl.signal.aborted) return;
            if (first) {
              firstFacets = out.facets;
              first = false;
            }
            acc.push(...out.items);
            lastCursor = out.nextCursor;
            cursor = out.nextCursor || undefined;
          } while (cursor && acc.length < targetCount);
          if (ctrl.signal.aborted) return;
          setItems(acc);
          setNextCursor(lastCursor);
          setFacets(firstFacets);
          if (cacheKey !== undefined) {
            setView(cacheKey, {
              items: acc,
              nextCursor: lastCursor,
              facets: firstFacets,
              scrollTop: getView(cacheKey)?.scrollTop ?? 0,
            });
          }
        } catch {
          // Background refresh failed — keep showing the cached data.
        } finally {
          if (!ctrl.signal.aborted) {
            loadingMoreRef.current = false;
            setIsRevalidating(false);
          }
        }
      })();

      return () => ctrl.abort();
    }

    setItems([]);
    setNextCursor("");
    setFacets({});
    setIsLoading(true);
    setError(null);

    buscarClientes(port, buildInput(), ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setItems(out.items);
        setNextCursor(out.nextCursor);
        setFacets(out.facets);
        if (cacheKey !== undefined) {
          setView(cacheKey, {
            items: out.items,
            nextCursor: out.nextCursor,
            facets: out.facets,
            scrollTop: 0,
          });
        }
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port, q, zona, cobrador, conSaldo, segmento, estadoPago, tier, bandaCredito, scoreMin, sortBy, sortOrder, limit, tick, cacheKey]);

  const loadMore = useCallback(() => {
    // Guard: only load more when there are more pages and no concurrent request.
    if (loadingMoreRef.current) return;

    // We read nextCursor from state at call time — the ref guard prevents races.
    setNextCursor((currentCursor) => {
      if (!currentCursor) return currentCursor; // hasMore = false, nothing to do
      loadingMoreRef.current = true;

      const ctrl = new AbortController();

      setIsLoadingMore(true);
      setError(null);

      buscarClientes(port, buildInput(currentCursor), ctrl.signal)
        .then((out) => {
          if (ctrl.signal.aborted) return;
          setItems((prev) => {
            const next = [...prev, ...out.items];
            // Persist the accumulated page to the view-cache (preserving scrollTop).
            if (cacheKey !== undefined) patchView(cacheKey, { items: next, nextCursor: out.nextCursor });
            return next;
          });
          setNextCursor(out.nextCursor);
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted) return;
          setError(toDomainError(e));
        })
        .finally(() => {
          loadingMoreRef.current = false;
          if (!ctrl.signal.aborted) setIsLoadingMore(false);
        });

      return currentCursor; // Don't mutate cursor until we get the new one back.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port, q, zona, cobrador, conSaldo, segmento, estadoPago, tier, bandaCredito, scoreMin, sortBy, sortOrder, limit, cacheKey]);

  // refresh clears the cached entry so the effect refetches instead of rehydrating.
  const refresh = useCallback(() => {
    if (cacheKey !== undefined) clearView(cacheKey);
    setTick((t) => t + 1);
  }, [cacheKey]);

  return {
    items,
    nextCursor,
    facets,
    isLoading,
    isLoadingMore,
    isRevalidating,
    error,
    hasMore: nextCursor !== "",
    loadMore,
    refresh,
  };
}
