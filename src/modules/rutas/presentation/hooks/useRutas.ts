import { useCallback, useEffect, useRef, useState } from "react";
import type { Ruta } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useRutasPort } from "../context/RutasContext";
import { listarRutas } from "../../application/usecases/listarRutas";
import { toDomainError } from "./lib/toDomainError";

export type UseRutasReturn = {
  rutas: ReadonlyArray<Ruta>;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useRutas fetches the full rutas list on mount.
// AbortController aborts any in-flight request when the effect re-runs
// or on unmount, so stale responses can never overwrite newer state.
export function useRutas(): UseRutasReturn {
  const port = useRutasPort();

  const [rutas, setRutas] = useState<ReadonlyArray<Ruta>>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    listarRutas(port, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setRutas(result);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { rutas, isLoading, error, refresh };
}
