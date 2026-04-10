import { useState, useEffect, useCallback, useRef } from "react";
import getGarantiasActivas, {
  GarantiaFilters,
} from "../services/api/getGarantiasActivas";
import { Garantia } from "../modules/garantias/Garantias";

interface UseGetGarantiasActivasReturn {
  garantias: Garantia[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useGetGarantiasActivas = (
  filters?: GarantiaFilters
): UseGetGarantiasActivasReturn => {
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef(filters);

  const fetchGarantias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGarantiasActivas(filtersRef.current);
      setGarantias(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar garantías"
      );
      setGarantias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    filtersRef.current = filters;
    fetchGarantias();
  }, [
    filters?.estado,
    filters?.fechaInicio,
    filters?.fechaFin,
    filters?.zonaClienteId,
    filters?.cliente,
    fetchGarantias,
  ]);

  return { garantias, loading, error, refetch: fetchGarantias };
};

export default useGetGarantiasActivas;
