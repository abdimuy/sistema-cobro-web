import { useCallback, useEffect, useState } from "react";
import { getVentaArchivo, type VentaArchivoDTO } from "@/services/api/getVentaArchivo";

export interface UseVentaArchivoReturn {
  venta: VentaArchivoDTO | null;
  loading: boolean;
  error: string | null;
  reintentar: () => void;
}

// Detalle de una venta de Archivo. Aborta al cambiar de id y no pide con null.
export function useVentaArchivo(id: string | null): UseVentaArchivoReturn {
  const [venta, setVenta] = useState<VentaArchivoDTO | null>(null);
  const [loading, setLoading] = useState(id !== null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setVenta(null);
    setError(null);
    if (id === null) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    getVentaArchivo(id, ctrl.signal)
      .then((v) => {
        if (!ctrl.signal.aborted) setVenta(v);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "No se pudo cargar la venta");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [id, tick]);

  const reintentar = useCallback(() => setTick((t) => t + 1), []);

  return { venta, loading, error, reintentar };
}

export default useVentaArchivo;
