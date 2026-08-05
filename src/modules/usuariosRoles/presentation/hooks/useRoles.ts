import { useCallback, useEffect, useRef, useState } from "react";
import type { Rol } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useUsuariosRolesPort } from "../context/UsuariosRolesContext";
import { listarRoles } from "../../application/usecases/listarRoles";
import { toDomainError } from "./lib/toDomainError";

export type UseRolesReturn = {
  roles: ReadonlyArray<Rol>;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useRoles fetches the full role catalog on mount. AbortController aborts
// any in-flight request when the effect re-runs or on unmount, so stale
// responses can never overwrite newer state.
export function useRoles(): UseRolesReturn {
  const port = useUsuariosRolesPort();

  const [roles, setRoles] = useState<ReadonlyArray<Rol>>([]);
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
    listarRoles(port, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setRoles(result);
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

  return { roles, isLoading, error, refresh };
}
