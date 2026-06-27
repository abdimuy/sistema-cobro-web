import { useCallback, useEffect, useRef, useState } from "react";
import type { AgingBucket } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useCarteraPort } from "../context/CarteraContext";
import { obtenerAging } from "../../application/usecases/obtenerAging";
import type { CarteraFilters } from "../../application/dto/CarteraFilters";
import { toDomainError } from "./lib/toDomainError";

export type UseAgingReturn = {
  buckets: AgingBucket[];
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useAging fetches the aging distribution applying the provided filters.
// Mirrors useSaludCartera: filter primitives drive the effect deps and the
// in-flight request is aborted on unmount or filter change.
export function useAging(filters: CarteraFilters = {}): UseAgingReturn {
  const port = useCarteraPort();
  const { zona, cobrador, periodo } = filters;

  const [buckets, setBuckets] = useState<AgingBucket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    obtenerAging(port, { zona, cobrador, periodo }, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setBuckets(data);
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
  }, [port, zona, cobrador, periodo, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { buckets, isLoading, error, refresh };
}
