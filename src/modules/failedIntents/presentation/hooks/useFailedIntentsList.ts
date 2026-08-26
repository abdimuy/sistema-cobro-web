import { useCallback, useEffect, useRef, useState } from "react";
import type { FailedIntent } from "../../domain/entities";
import type { IntentStatusValue } from "../../domain/values";
import { useFailedIntentsPort } from "../context/FailedIntentsContext";
import { listarIntents } from "../../application/usecases/listarIntents";
import { DomainError } from "../../domain/errors";

export type UseFailedIntentsListOptions = {
  status?: IntentStatusValue;
  // modulo viaja al servidor como parámetro de la consulta. Cambiarlo reinicia
  // el cursor, igual que cambiar el estado: son dos listas distintas.
  modulo?: string;
  pageSize?: number;
};

export type UseFailedIntentsListReturn = {
  items: ReadonlyArray<FailedIntent>;
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
  loadNext: () => void;
};

// useFailedIntentsList paginates the admin list. Filter changes reset
// the cursor + items; loadNext appends.
//
// In-flight requests are aborted when the filter changes or the
// component unmounts so a slow response can't overwrite a newer one.
export function useFailedIntentsList(
  opts: UseFailedIntentsListOptions = {},
): UseFailedIntentsListReturn {
  const port = useFailedIntentsPort();
  const { status, modulo, pageSize = 20 } = opts;

  const [items, setItems] = useState<ReadonlyArray<FailedIntent>>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  // Tick increments to force a re-fetch on refresh().
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  // Initial fetch (or filter / refresh).
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    listarIntents(port, { status, modulo, pageSize }, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setItems(out.items);
        setNextCursor(out.nextCursor);
        setHasMore(out.hasMore);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, status, modulo, pageSize, tick]);

  const loadNext = useCallback(() => {
    if (isLoading || !hasMore || !nextCursor) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    listarIntents(port, { status, modulo, pageSize, cursor: nextCursor }, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setItems((prev) => [...prev, ...out.items]);
        setNextCursor(out.nextCursor);
        setHasMore(out.hasMore);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });
  }, [port, status, modulo, pageSize, nextCursor, hasMore, isLoading]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { items, nextCursor, hasMore, isLoading, error, refresh, loadNext };
}

function toDomainError(e: unknown): DomainError {
  if (e instanceof DomainError) return e;
  if (e instanceof Error) return new DomainError("error_inesperado", e.message);
  return new DomainError("error_inesperado", String(e));
}
