import { useState, useEffect } from "react";
import { URL_API_V2 } from "../constants/api";
import { auth } from "../../firebase";

export interface Almacen {
  ALMACEN_ID: number;
  ALMACEN: string;
  EXISTENCIAS: number;
}

// Wire shape returned by the Go backend. Translated to the public
// UPPER_SNAKE_CASE shape below so consumers stay untouched.
interface AlmacenWire {
  almacen_id: number;
  almacen: string;
  existencias: number;
}

interface AlmacenesResponse {
  items: AlmacenWire[];
}

interface UseGetAlmacenesReturn {
  almacenes: Almacen[];
  getAlmacenById: (id: number) => Almacen | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache global para evitar múltiples peticiones
let almacenesCache: Almacen[] | null = null;
let cachePromise: Promise<Almacen[]> | null = null;

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fromWire = (w: AlmacenWire): Almacen => ({
  ALMACEN_ID: w.almacen_id,
  ALMACEN: w.almacen,
  EXISTENCIAS: w.existencias,
});

const useGetAlmacenes = (): UseGetAlmacenesReturn => {
  const [almacenes, setAlmacenes] = useState<Almacen[]>(almacenesCache || []);
  const [loading, setLoading] = useState<boolean>(!almacenesCache);
  const [error, setError] = useState<string | null>(null);

  const fetchAlmacenes = async (): Promise<Almacen[]> => {
    // Si ya hay una petición en curso, esperarla
    if (cachePromise) {
      return cachePromise;
    }

    // Si ya tenemos cache, devolverlo
    if (almacenesCache) {
      return almacenesCache;
    }

    // Crear nueva petición
    cachePromise = (async () => {
      try {
        const headers = await authHeaders();
        const response = await fetch(`${URL_API_V2}/v2/almacenes`, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: AlmacenesResponse = await response.json();
        const mapped = (data.items || []).map(fromWire);
        almacenesCache = mapped;
        return mapped;
      } catch (err) {
        console.error("Error fetching almacenes:", err);
        throw err;
      } finally {
        cachePromise = null;
      }
    })();

    return cachePromise;
  };

  const loadAlmacenes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlmacenes();
      setAlmacenes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar almacenes");
      setAlmacenes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlmacenes();
  }, []);

  const getAlmacenById = (id: number): Almacen | undefined => {
    return almacenes.find(a => a.ALMACEN_ID === id);
  };

  const refetch = async () => {
    almacenesCache = null; // Limpiar cache
    await loadAlmacenes();
  };

  return { almacenes, getAlmacenById, loading, error, refetch };
};

export default useGetAlmacenes;
