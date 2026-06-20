import { useEffect, useRef, useState } from "react";
import type { PagoDetalle } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { obtenerPagoDetalle } from "../../application/usecases/obtenerPagoDetalle";
import { toDomainError } from "./lib/toDomainError";

export type UsePagoDetalleReturn = {
  detalle: PagoDetalle | null;
  isLoading: boolean;
  error: DomainError | null;
};

// usePagoDetalle fetches the detail for a single pago (CC document).
// When doctoCcId is null (modal closed), it performs no fetch and returns
// { detalle: null, isLoading: false, error: null }.
// Re-fetches when clienteId or doctoCcId change.
export function usePagoDetalle(
  clienteId: number,
  doctoCcId: number | null,
): UsePagoDetalleReturn {
  const port = useClientesPort();

  const [detalle, setDetalle] = useState<PagoDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // No fetch when modal is closed.
    if (doctoCcId === null) {
      setDetalle(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    obtenerPagoDetalle(port, { clienteId, doctoCcId }, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setDetalle(out);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, clienteId, doctoCcId]);

  return { detalle, isLoading, error };
}
