import { useState, useEffect, useCallback } from "react";
import getEstadosGarantia, {
  EstadoGarantia,
} from "../services/api/getEstadosGarantia";

interface UseGetEstadosGarantiaReturn {
  estados: EstadoGarantia[];
  loading: boolean;
  error: string | null;
  getEstadoLabel: (value: string) => string;
}

let estadosCache: EstadoGarantia[] | null = null;
let cachePromise: Promise<EstadoGarantia[]> | null = null;

const useGetEstadosGarantia = (): UseGetEstadosGarantiaReturn => {
  const [estados, setEstados] = useState<EstadoGarantia[]>(
    estadosCache || []
  );
  const [loading, setLoading] = useState<boolean>(!estadosCache);
  const [error, setError] = useState<string | null>(null);

  const fetchEstados = async (): Promise<EstadoGarantia[]> => {
    if (cachePromise) return cachePromise;
    if (estadosCache) return estadosCache;

    cachePromise = (async () => {
      try {
        const data = await getEstadosGarantia();
        estadosCache = data;
        return data;
      } finally {
        cachePromise = null;
      }
    })();

    return cachePromise;
  };

  const loadEstados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEstados();
      setEstados(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar estados"
      );
      setEstados([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstados();
  }, [loadEstados]);

  const getEstadoLabel = useCallback(
    (value: string): string => {
      const found = estados.find((e) => e.value === value);
      return found ? found.label : value.replace(/_/g, " ");
    },
    [estados]
  );

  return { estados, loading, error, getEstadoLabel };
};

export default useGetEstadosGarantia;
