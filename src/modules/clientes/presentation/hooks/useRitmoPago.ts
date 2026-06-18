import { useCallback, useEffect, useRef, useState } from "react";
import type { RitmoPago } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { obtenerRitmoPago } from "../../application/usecases/obtenerRitmoPago";
import type { FichaDateRange } from "../../application/ports/ClientesPort";
import { toDomainError } from "./lib/toDomainError";

export type UseRitmoPagoReturn = {
  ritmo: RitmoPago | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useRitmoPago fetches the payment rhythm data for the given clienteId.
// Re-fetches when clienteId or range changes. Uses AbortController to cancel
// in-flight requests when deps change or the component unmounts.
// Primitive desde/hasta are used as deps (not the range object) to avoid
// render loops.
export function useRitmoPago(
  clienteId: number,
  range?: FichaDateRange,
): UseRitmoPagoReturn {
  const port = useClientesPort();
  const desde = range?.desde;
  const hasta = range?.hasta;

  const [ritmo, setRitmo] = useState<RitmoPago | null>(null);
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
    obtenerRitmoPago(port, clienteId, activeRange, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setRitmo(out);
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

  return { ritmo, isLoading, error, refresh };
}
