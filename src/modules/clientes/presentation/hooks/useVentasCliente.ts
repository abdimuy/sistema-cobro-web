import { useCallback, useEffect, useRef, useState } from "react";
import type { VentaCliente } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { listarVentasCliente } from "../../application/usecases/listarVentasCliente";
import { toDomainError } from "./lib/toDomainError";

export type UseVentasClienteReturn = {
  ventas: ReadonlyArray<VentaCliente>;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: DomainError | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
};

// useVentasCliente fetches the paginated list of ventas for a given client.
// Accumulates pages (infinite scroll). Resets when clienteId changes.
export function useVentasCliente(
  clienteId: number,
  limit?: number,
): UseVentasClienteReturn {
  const port = useClientesPort();

  const [ventas, setVentas] = useState<ReadonlyArray<VentaCliente>>([]);
  const [nextCursor, setNextCursor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  // Tick increments to force a re-fetch on refresh().
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  // First page fetch — triggered by clienteId/limit/tick changes.
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setVentas([]);
    setNextCursor("");
    setIsLoading(true);
    setError(null);
    loadingMoreRef.current = false;

    listarVentasCliente(port, { clienteId, limit }, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setVentas(out.items);
        setNextCursor(out.nextCursor);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, clienteId, limit, tick]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;

    setNextCursor((currentCursor) => {
      if (!currentCursor) return currentCursor;
      loadingMoreRef.current = true;

      const ctrl = new AbortController();

      setIsLoadingMore(true);
      setError(null);

      listarVentasCliente(
        port,
        { clienteId, limit, cursor: currentCursor },
        ctrl.signal,
      )
        .then((out) => {
          if (ctrl.signal.aborted) return;
          setVentas((prev) => [...prev, ...out.items]);
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

      return currentCursor;
    });
  }, [port, clienteId, limit]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return {
    ventas,
    isLoading,
    isLoadingMore,
    error,
    hasMore: nextCursor !== "",
    loadMore,
    refresh,
  };
}
