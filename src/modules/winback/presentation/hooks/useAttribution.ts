import { useCallback, useEffect, useRef, useState } from "react";
import type { WinbackAttribution } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useWinbackPort } from "../context/WinbackContext";
import { obtenerAttribution } from "../../application/usecases/obtenerAttribution";

export type UseAttributionReturn = {
  attribution: WinbackAttribution | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useAttribution fetches the winback attribution metrics, optionally scoped
// to a zona. Re-fetches whenever zona changes. In-flight requests are aborted
// on zona change or unmount.
export function useAttribution(
  opts: { zona?: string } = {},
): UseAttributionReturn {
  const port = useWinbackPort();
  const { zona } = opts;

  const [attribution, setAttribution] = useState<WinbackAttribution | null>(
    null,
  );
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
    obtenerAttribution(port, { zona }, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setAttribution(out);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, zona, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { attribution, isLoading, error, refresh };
}

function toDomainError(e: unknown): DomainError {
  if (e instanceof DomainError) return e;
  if (e instanceof Error) return new DomainError("error_inesperado", e.message);
  return new DomainError("error_inesperado", String(e));
}
