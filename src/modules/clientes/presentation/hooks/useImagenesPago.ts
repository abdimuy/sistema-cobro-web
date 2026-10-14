import { useEffect, useState } from "react";
import type { ImagenPago } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { toDomainError } from "./lib/toDomainError";

// Fotos de un pago; con pagoRecibidoId null no hace nada ("Sin comprobante").
export function useImagenesPago(pagoRecibidoId: string | null) {
  const port = useClientesPort();
  const [imagenes, setImagenes] = useState<ImagenPago[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);

  useEffect(() => {
    if (pagoRecibidoId === null) {
      setImagenes([]);
      setIsLoading(false);
      setError(null);
      return undefined;
    }
    const ctrl = new AbortController();
    setImagenes([]);
    setIsLoading(true);
    setError(null);
    port
      .listarImagenesPago(pagoRecibidoId, ctrl.signal)
      .then((r) => {
        if (!ctrl.signal.aborted) setImagenes(r);
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });
    return () => ctrl.abort();
  }, [port, pagoRecibidoId]);

  return { imagenes, isLoading, error };
}
