import { useCallback, useEffect, useRef, useState } from "react";
import type { FailedIntent } from "../../domain/entities";
import { useFailedIntentsPort } from "../context/FailedIntentsContext";
import { obtenerIntent } from "../../application/usecases/obtenerIntent";
import { DomainError } from "../../domain/errors";

export type UseFailedIntentDetailReturn = {
  intent: FailedIntent | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
  // setLocal lets the caller swap in an entity it just received from
  // a replay/resolve action without a round-trip.
  setLocal: (intent: FailedIntent) => void;
};

export function useFailedIntentDetail(
  intentId: string | null,
): UseFailedIntentDetailReturn {
  const port = useFailedIntentsPort();

  const [intent, setIntent] = useState<FailedIntent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    if (!intentId) {
      setIntent(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    obtenerIntent(port, intentId, ctrl.signal)
      .then((i) => {
        if (ctrl.signal.aborted) return;
        setIntent(i);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(
          e instanceof DomainError
            ? e
            : new DomainError("error_inesperado", String(e)),
        );
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, intentId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const setLocal = useCallback((i: FailedIntent) => setIntent(i), []);

  return { intent, isLoading, error, refresh, setLocal };
}
