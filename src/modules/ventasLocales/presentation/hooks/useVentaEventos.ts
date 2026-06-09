import { useEffect, useRef, useState } from "react";
import type { VentaEvento } from "../../domain/entities/VentaEvento";
import { HttpVentaEventosAdapter } from "../../infrastructure/http/HttpVentaEventosAdapter";
import { obtenerEventosVenta } from "../../application/usecases/obtenerEventosVenta";
import { DomainError } from "../../domain/errors";

const adapter = new HttpVentaEventosAdapter();

export interface UseVentaEventosReturn {
  eventos: VentaEvento[];
  isLoading: boolean;
  error: string | null;
}

export function useVentaEventos(ventaID: string): UseVentaEventosReturn {
  const [eventos, setEventos] = useState<VentaEvento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);

    obtenerEventosVenta(adapter, ventaID, ctrl.signal)
      .then((items) => {
        if (ctrl.signal.aborted) return;
        setEventos(items);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if (err instanceof DomainError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("error inesperado");
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [ventaID]);

  return { eventos, isLoading, error };
}
