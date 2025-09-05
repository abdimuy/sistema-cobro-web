import { useState, useEffect, useCallback } from "react";
import { VentaLocal, getVentasLocales } from "../services/api/getVentasLocales";

interface UseGetVentasLocalesParams {
  fechaInicio?: string;
  fechaFin?: string;
  nombreCliente?: string;
  limit?: number;
  offset?: number;
}

interface UseGetVentasLocalesReturn {
  ventas: VentaLocal[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useGetVentasLocales = (params?: UseGetVentasLocalesParams): UseGetVentasLocalesReturn => {
  const [ventas, setVentas] = useState<VentaLocal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVentas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVentasLocales(params);
      setVentas(data || []);
    } catch (err) {
      console.error("Error fetching ventas locales:", err);
      setError(err instanceof Error ? err.message : "Error al cargar las ventas");
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }, [params?.fechaInicio, params?.fechaFin, params?.nombreCliente, params?.limit, params?.offset]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  return { ventas, loading, error, refetch: fetchVentas };
};

export default useGetVentasLocales;