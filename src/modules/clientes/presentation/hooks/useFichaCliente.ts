import { useCallback, useEffect, useRef, useState } from "react";
import type { FichaCliente } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { obtenerFichaCliente } from "../../application/usecases/obtenerFichaCliente";
import type { FichaDateRange } from "../../application/ports/ClientesPort";
import { toDomainError } from "./lib/toDomainError";

export type UseFichaClienteReturn = {
  ficha: FichaCliente | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useFichaCliente fetches the full client profile for the given clienteId.
// Re-fetches when clienteId or range changes. Uses AbortController to cancel
// in-flight requests when deps change or the component unmounts.
// Primitive desde/hasta are used as deps (not the range object) to avoid
// render loops — mirrors the pattern in useBuscarClientes.
export function useFichaCliente(
  clienteId: number,
  range?: FichaDateRange,
): UseFichaClienteReturn {
  const port = useClientesPort();
  const desde = range?.desde;
  const hasta = range?.hasta;

  const [ficha, setFicha] = useState<FichaCliente | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  // Tick increments to force a re-fetch on refresh().
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const activeRange: FichaDateRange | undefined =
      desde !== undefined || hasta !== undefined ? { desde, hasta } : undefined;

    setIsLoading(true);
    setError(null);
    obtenerFichaCliente(port, clienteId, activeRange, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setFicha(out);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, clienteId, desde, hasta, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { ficha, isLoading, error, refresh };
}
