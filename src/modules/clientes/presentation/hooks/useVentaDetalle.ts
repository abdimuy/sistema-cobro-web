import { useEffect, useRef, useState } from "react";
import type { VentaDetalle } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { obtenerVentaDetalle } from "../../application/usecases/obtenerVentaDetalle";
import { toDomainError } from "./lib/toDomainError";

export type UseVentaDetalleReturn = {
  detalle: VentaDetalle | null;
  isLoading: boolean;
  error: DomainError | null;
};

// useVentaDetalle fetches the detail for a single venta.
// When doctoPvId is null (modal closed), it performs no fetch and returns
// { detalle: null, isLoading: false, error: null }.
// Re-fetches when clienteId or doctoPvId change.
export function useVentaDetalle(
  clienteId: number,
  doctoPvId: number | null,
): UseVentaDetalleReturn {
  const port = useClientesPort();

  const [detalle, setDetalle] = useState<VentaDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // No fetch when modal is closed.
    if (doctoPvId === null) {
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
    obtenerVentaDetalle(port, { clienteId, doctoPvId }, ctrl.signal)
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
  }, [port, clienteId, doctoPvId]);

  return { detalle, isLoading, error };
}
