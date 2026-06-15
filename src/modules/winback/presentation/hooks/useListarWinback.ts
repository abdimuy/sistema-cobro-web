import { useCallback, useEffect, useRef, useState } from "react";
import type { WinbackItem } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useWinbackPort } from "../context/WinbackContext";
import { listarWinback } from "../../application/usecases/listarWinback";
import type { ListarWinbackInput } from "../../application/dto";

export type UseListarWinbackReturn = {
  items: ReadonlyArray<WinbackItem>;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useListarWinback fetches the winback list applying the provided filters.
// The API returns a bounded array — no cursor pagination; the table paginates
// client-side. Filter changes trigger a re-fetch and abort any in-flight
// request so stale responses can never overwrite newer ones.
//
// IMPORTANT: deps use primitive fields (not the object reference) to avoid
// an infinite effect loop when the caller passes an inline object literal.
export function useListarWinback(
  filters: ListarWinbackInput = {},
): UseListarWinbackReturn {
  const port = useWinbackPort();
  const { segmento, zona, limit, incluirControl, incluirActivos } = filters;

  const [items, setItems] = useState<ReadonlyArray<WinbackItem>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  // Tick increments to force a re-fetch on refresh().
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    listarWinback(
      port,
      { segmento, zona, limit, incluirControl, incluirActivos },
      ctrl.signal,
    )
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setItems(out.items);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
    // Depend on primitive filter fields — not the filters object — to avoid
    // re-running on every render when the caller passes an inline literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port, segmento, zona, limit, incluirControl, incluirActivos, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { items, isLoading, error, refresh };
}

function toDomainError(e: unknown): DomainError {
  if (e instanceof DomainError) return e;
  if (e instanceof Error) return new DomainError("error_inesperado", e.message);
  return new DomainError("error_inesperado", String(e));
}
