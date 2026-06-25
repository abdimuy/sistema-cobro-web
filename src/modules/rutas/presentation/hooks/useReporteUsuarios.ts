import { useCallback, useEffect, useRef, useState } from "react";
import type { ReporteUsuario } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useRutasPort } from "../context/RutasContext";
import { listarReporteUsuarios } from "../../application/usecases/listarReporteUsuarios";
import { toDomainError } from "./lib/toDomainError";

export type UseReporteUsuariosReturn = {
  usuarios: ReadonlyArray<ReporteUsuario>;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useReporteUsuarios fetches the per-user cobranza report on mount.
// AbortController aborts any in-flight request when the effect re-runs
// or on unmount, so stale responses can never overwrite newer state.
export function useReporteUsuarios(): UseReporteUsuariosReturn {
  const port = useRutasPort();

  const [usuarios, setUsuarios] = useState<ReadonlyArray<ReporteUsuario>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DomainError | null>(null);
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    listarReporteUsuarios(port, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setUsuarios(result);
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

  return { usuarios, isLoading, error, refresh };
}
