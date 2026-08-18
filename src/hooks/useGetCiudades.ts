import { useState, useEffect, useCallback } from "react";
import getCiudades, { Ciudad } from "../services/api/getCiudades";

// ============================================================================
// Types
// ============================================================================

interface UseGetCiudadesReturn {
  ciudades: Ciudad[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// Cache
// ============================================================================

// El catálogo lo mantiene la oficina en Microsip y cambia unas pocas veces al
// año, así que se carga una vez por sesión (mismo criterio que las zonas y que
// el caché de 7 días de la app Android).
let ciudadesCache: Ciudad[] | null = null;
let cachePromise: Promise<Ciudad[]> | null = null;

// ============================================================================
// Hook
// ============================================================================

const useGetCiudades = (): UseGetCiudadesReturn => {
  const [ciudades, setCiudades] = useState<Ciudad[]>(ciudadesCache || []);
  const [loading, setLoading] = useState<boolean>(!ciudadesCache);
  const [error, setError] = useState<string | null>(null);

  const fetchCiudades = async (): Promise<Ciudad[]> => {
    if (cachePromise) {
      return cachePromise;
    }

    if (ciudadesCache) {
      return ciudadesCache;
    }

    cachePromise = (async () => {
      try {
        const data = await getCiudades();
        ciudadesCache = data;
        return data;
      } finally {
        cachePromise = null;
      }
    })();

    return cachePromise;
  };

  const loadCiudades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCiudades();
      setCiudades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ciudades");
      setCiudades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCiudades();
  }, [loadCiudades]);

  const refetch = useCallback(async () => {
    ciudadesCache = null;
    await loadCiudades();
  }, [loadCiudades]);

  return { ciudades, loading, error, refetch };
};

export default useGetCiudades;
