import { useCallback, useEffect, useRef, useState } from "react";
import type { ZonaCajaAsignacion } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useConfiguracionPort } from "../context/ConfiguracionContext";
import { listarZonasCajas } from "../../application/usecases/listarZonasCajas";
import { toDomainError } from "./lib/toDomainError";

export type UseZonasCajasReturn = {
  zonasCajas: ReadonlyArray<ZonaCajaAsignacion>;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useZonasCajas fetches the full zona→caja/cajero/vendedor/cobrador config
// list on mount. AbortController aborts any in-flight request when the
// effect re-runs or on unmount, so stale responses can never overwrite
// newer state.
export function useZonasCajas(): UseZonasCajasReturn {
  const port = useConfiguracionPort();

  const [zonasCajas, setZonasCajas] = useState<ReadonlyArray<ZonaCajaAsignacion>>([]);
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
    listarZonasCajas(port, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setZonasCajas(result);
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

  return { zonasCajas, isLoading, error, refresh };
}
