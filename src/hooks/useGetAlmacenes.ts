import { useState, useEffect } from "react";
import { URL_API } from "../constants/api";

export interface Almacen {
  ALMACEN_ID: number;
  ALMACEN: string;
  EXISTENCIAS: number;
}

interface AlmacenesResponse {
  error: string;
  body: Almacen[];
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
        const response = await fetch(`${URL_API}/almacenes`);
        const data: AlmacenesResponse = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        almacenesCache = data.body;
        return data.body;
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