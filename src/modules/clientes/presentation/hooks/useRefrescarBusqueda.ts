import { useCallback, useState } from "react";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { refrescarBusqueda } from "../../application/usecases/refrescarBusqueda";
import type { RefrescarBusquedaOutput } from "../../application/dto";
import { toDomainError } from "./lib/toDomainError";

export type UseRefrescarBusquedaReturn = {
  refrescar: () => Promise<void>;
  isRefreshing: boolean;
  result: RefrescarBusquedaOutput | null;
  error: DomainError | null;
};

// useRefrescarBusqueda is an imperative action hook — the caller calls
// refrescar() to trigger a re-index of the search cache.
// No automatic fetch on mount.
export function useRefrescarBusqueda(): UseRefrescarBusquedaReturn {
  const port = useClientesPort();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState<RefrescarBusquedaOutput | null>(null);
  const [error, setError] = useState<DomainError | null>(null);

  const refrescar = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const out = await refrescarBusqueda(port);
      setResult(out);
    } catch (e: unknown) {
      setError(toDomainError(e));
    } finally {
      setIsRefreshing(false);
    }
  }, [port, isRefreshing]);

  return { refrescar, isRefreshing, result, error };
}
