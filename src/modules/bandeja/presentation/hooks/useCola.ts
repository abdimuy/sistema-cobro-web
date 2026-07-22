import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversacionResumen } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useBandeja } from "../context/BandejaContext";
import { listarCola } from "../../application/usecases/listarCola";
import { toDomainError } from "./lib/toDomainError";

// Queue rows go stale quickly (an operator's colleague can claim/answer a
// conversation any moment) — 20s keeps the bandeja fresh without hammering
// the backend.
const POLL_INTERVAL_MS = 20_000;

export type UseColaReturn = {
  items: ConversacionResumen[];
  loading: boolean;
  error: DomainError | null;
  refetch: () => void;
};

// useCola fetches the bandeja queue on mount and polls every 20s.
// AbortController cancels any in-flight request when a new one starts or
// on unmount, so a slow response can never overwrite fresher state.
export function useCola(): UseColaReturn {
  const { port } = useBandeja();

  const [items, setItems] = useState<ConversacionResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DomainError | null>(null);
  // Tick increments to force an immediate re-fetch on refetch().
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCola = () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      setError(null);
      listarCola(port, undefined, ctrl.signal)
        .then((result) => {
          if (ctrl.signal.aborted || cancelled) return;
          setItems(result);
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted || cancelled) return;
          setError(toDomainError(e));
        })
        .finally(() => {
          if (!ctrl.signal.aborted && !cancelled) setLoading(false);
        });
    };

    fetchCola();
    const intervalId = setInterval(fetchCola, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      abortRef.current?.abort();
    };
  }, [port, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { items, loading, error, refetch };
}
