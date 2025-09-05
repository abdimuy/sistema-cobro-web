import { useState, useEffect, useCallback } from "react";
import { VentaCompleta, getVentaLocalCompleta } from "../services/api/getVentasLocales";

interface UseGetVentaLocalCompletaReturn {
  venta: VentaCompleta | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useGetVentaLocalCompleta = (ventaId: string | null): UseGetVentaLocalCompletaReturn => {
  const [venta, setVenta] = useState<VentaCompleta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVenta = useCallback(async () => {
    if (!ventaId) {
      setVenta(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getVentaLocalCompleta(ventaId);
      setVenta(data);
    } catch (err) {
      console.error("Error fetching venta completa:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los detalles de la venta");
      setVenta(null);
    } finally {
      setLoading(false);
    }
  }, [ventaId]);

  useEffect(() => {
    fetchVenta();
  }, [fetchVenta]);

  return { venta, loading, error, refetch: fetchVenta };
};

export default useGetVentaLocalCompleta;