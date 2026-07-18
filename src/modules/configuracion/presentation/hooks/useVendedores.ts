import { useCallback, useEffect, useRef, useState } from "react";
import type { VendedorAsignacion } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useConfiguracionPort } from "../context/ConfiguracionContext";
import { listarVendedores } from "../../application/usecases/listarVendedores";
import { toDomainError } from "./lib/toDomainError";

export type UseVendedoresReturn = {
  vendedores: ReadonlyArray<VendedorAsignacion>;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useVendedores fetches the full vendor-mapping list on mount.
// AbortController aborts any in-flight request when the effect re-runs
// or on unmount, so stale responses can never overwrite newer state.
export function useVendedores(): UseVendedoresReturn {
  const port = useConfiguracionPort();

  const [vendedores, setVendedores] = useState<ReadonlyArray<VendedorAsignacion>>([]);
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
    listarVendedores(port, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setVendedores(result);
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

  return { vendedores, isLoading, error, refresh };
}
