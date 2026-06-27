import { useCallback, useEffect, useRef, useState } from "react";
import type { CuentaRiesgo } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useCarteraPort } from "../context/CarteraContext";
import { listarCuentasRiesgo } from "../../application/usecases/listarCuentasRiesgo";
import { toDomainError } from "./lib/toDomainError";

export type UseCuentasRiesgoReturn = {
  cuentas: CuentaRiesgo[];
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useCuentasRiesgo is portfolio-wide: the backend ignores zona/cobrador for
// /cuentas-riesgo in v1. Do not wire to the global filter bar — not a bug.
export function useCuentasRiesgo(): UseCuentasRiesgoReturn {
  const port = useCarteraPort();
  const [cuentas, setCuentas] = useState<CuentaRiesgo[]>([]);
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
    listarCuentasRiesgo(port, {}, ctrl.signal)
      .then((data) => { if (ctrl.signal.aborted) return; setCuentas(data); })
      .catch((e: unknown) => { if (ctrl.signal.aborted) return; setError(toDomainError(e)); })
      .finally(() => { if (!ctrl.signal.aborted) setIsLoading(false); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { cuentas, isLoading, error, refresh };
}
