import { useState, useEffect, useCallback } from "react";
import getZonasCliente, { ZonaCliente } from "../services/api/getZonasCliente";

// ============================================================================
// Types
// ============================================================================

interface UseGetZonasClienteReturn {
  zonas: ZonaCliente[];
  loading: boolean;
  error: string | null;
  getZonaById: (id: number) => ZonaCliente | undefined;
  refetch: () => Promise<void>;
}

// ============================================================================
// Cache
// ============================================================================

let zonasCache: ZonaCliente[] | null = null;
let cachePromise: Promise<ZonaCliente[]> | null = null;

// ============================================================================
// Hook
// ============================================================================

const useGetZonasCliente = (): UseGetZonasClienteReturn => {
  const [zonas, setZonas] = useState<ZonaCliente[]>(zonasCache || []);
  const [loading, setLoading] = useState<boolean>(!zonasCache);
  const [error, setError] = useState<string | null>(null);

  const fetchZonas = async (): Promise<ZonaCliente[]> => {
    if (cachePromise) {
      return cachePromise;
    }

    if (zonasCache) {
      return zonasCache;
    }

    cachePromise = (async () => {
      try {
        const data = await getZonasCliente();
        zonasCache = data;
        return data;
      } finally {
        cachePromise = null;
      }
    })();

    return cachePromise;
  };

  const loadZonas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchZonas();
      setZonas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar zonas");
      setZonas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZonas();
  }, [loadZonas]);

  const getZonaById = useCallback(
    (id: number): ZonaCliente | undefined => {
      return zonas.find((z) => z.ZONA_CLIENTE_ID === id);
    },
    [zonas]
  );

  const refetch = useCallback(async () => {
    zonasCache = null;
    await loadZonas();
  }, [loadZonas]);

  return { zonas, loading, error, getZonaById, refetch };
};

export default useGetZonasCliente;
