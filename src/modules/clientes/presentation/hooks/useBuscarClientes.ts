import { useCallback, useEffect, useRef, useState } from "react";
import type { Cliente } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { buscarClientes } from "../../application/usecases/buscarClientes";
import type { BuscarClientesInput, DirectorioFacets } from "../../application/dto";
import type { SegmentoValue, EstadoPagoValue } from "../../domain/values";
import { toDomainError } from "./lib/toDomainError";

export type UseBuscarClientesReturn = {
  items: ReadonlyArray<Cliente>;
  nextCursor: string;
  facets: DirectorioFacets;
  isLoading: boolean;
  isLoadingMore: boolean;
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
    scoreMin,
    sortBy,
    sortOrder,
    limit,
  } = filters;

  const [items, setItems] = useState<ReadonlyArray<Cliente>>([]);
  const [nextCursor, setNextCursor] = useState("");
  // facets are captured from the first-page response and reset on filter change.
  // loadMore does not update facets — the first page facets describe the whole set.
  const [facets, setFacets] = useState<DirectorioFacets>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
      ...(scoreMin !== undefined && { scoreMin }),
      ...(sortBy !== undefined && { sortBy }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(limit !== undefined && { limit }),
      ...(cursor !== undefined && { cursor }),
    };
  }

  // First page fetch — triggered by filter/tick changes.
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setItems([]);
    setNextCursor("");
    setFacets({});
    setIsLoading(true);
    setError(null);
    loadingMoreRef.current = false;

    buscarClientes(port, buildInput(), ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setItems(out.items);
        setNextCursor(out.nextCursor);
        setFacets(out.facets);
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
  }, [port, q, zona, cobrador, conSaldo, segmento, estadoPago, tier, scoreMin, sortBy, sortOrder, limit, tick]);

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
          setItems((prev) => [...prev, ...out.items]);
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
  }, [port, q, zona, cobrador, conSaldo, segmento, estadoPago, tier, scoreMin, sortBy, sortOrder, limit]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return {
    items,
    nextCursor,
    facets,
    isLoading,
    isLoadingMore,
    error,
    hasMore: nextCursor !== "",
    loadMore,
    refresh,
  };
}
