/**
 * @deprecated Consume la API legacy v1 (`/ventas/:id` Node en :3002) y se
 * reemplazó por `useVentaV2` (`/v2/ventas/:id` en msp-api Go). Pendiente de
 * borrar cuando ningún otro módulo lo referencie.
 *
 * Para editar ventas en arquitectura hexagonal, ver
 * `src/modules/ventasLocales/presentation/hooks/useVentaEditState.ts` y
 * `useGuardarEdicionVenta.ts`.
 */
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