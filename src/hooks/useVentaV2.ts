import { useCallback, useEffect, useState } from "react";
import { getVentaV2, VentaV2 } from "../services/api/ventaV2Types";

export interface UseVentaV2Return {
  venta: VentaV2 | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useVentaV2 = (ventaId: string | null): UseVentaV2Return => {
  const [venta, setVenta] = useState<VentaV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVenta = useCallback(async () => {
    if (!ventaId) {
      setVenta(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getVentaV2(ventaId);
      setVenta(data);
    } catch (err) {
      console.error("Error fetching venta v2:", err);
      setError(err instanceof Error ? err.message : "Error al cargar la venta");
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

export default useVentaV2;
