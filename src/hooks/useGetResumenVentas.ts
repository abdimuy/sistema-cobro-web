import { useState, useEffect, useCallback } from "react";
import { ResumenVentas, getResumenVentas } from "../services/api/getVentasLocales";

interface UseGetResumenVentasReturn {
  resumen: ResumenVentas | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useGetResumenVentas = (fechaInicio?: string, fechaFin?: string): UseGetResumenVentasReturn => {
  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumen = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getResumenVentas(fechaInicio, fechaFin);
      setResumen(data);
    } catch (err) {
      console.error("Error fetching resumen ventas:", err);
      setError(err instanceof Error ? err.message : "Error al cargar el resumen");
      setResumen(null);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    fetchResumen();
  }, [fetchResumen]);

  return { resumen, loading, error, refetch: fetchResumen };
};

export default useGetResumenVentas;