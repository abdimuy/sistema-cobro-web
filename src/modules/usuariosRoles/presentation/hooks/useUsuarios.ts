import { useCallback, useEffect, useRef, useState } from "react";
import type { Usuario } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useUsuariosRolesPort } from "../context/UsuariosRolesContext";
import { listarUsuarios } from "../../application/usecases/listarUsuarios";
import { toDomainError } from "./lib/toDomainError";

export type UseUsuariosReturn = {
  usuarios: ReadonlyArray<Usuario>;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useUsuarios fetches the full user directory on mount. AbortController
// aborts any in-flight request when the effect re-runs or on unmount, so
// stale responses can never overwrite newer state.
export function useUsuarios(): UseUsuariosReturn {
  const port = useUsuariosRolesPort();

  const [usuarios, setUsuarios] = useState<ReadonlyArray<Usuario>>([]);
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
    listarUsuarios(port, ctrl.signal)
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
