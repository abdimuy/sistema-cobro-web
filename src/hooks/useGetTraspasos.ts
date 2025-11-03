import { useState, useEffect } from "react";
import { Traspaso, FiltrosTraspasos } from "../types/traspasos";
import { getTraspasos } from "../services/api/traspasos";

interface UseGetTraspasosReturn {
  traspasos: Traspaso[];
  loading: boolean;
  error: string | null;
  refetch: (filtros?: FiltrosTraspasos) => Promise<void>;
}

const useGetTraspasos = (filtrosIniciales?: FiltrosTraspasos): UseGetTraspasosReturn => {
  const [traspasos, setTraspasos] = useState<Traspaso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTraspasos = async (filtros?: FiltrosTraspasos) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTraspasos(filtros);
      setTraspasos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar traspasos");
      setTraspasos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraspasos(filtrosIniciales);
  }, []);

  const refetch = async (filtros?: FiltrosTraspasos) => {
    await fetchTraspasos(filtros);
  };

  return { traspasos, loading, error, refetch };
};

export default useGetTraspasos;
