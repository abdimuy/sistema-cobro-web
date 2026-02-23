import { useState, useEffect } from "react";
import { getVendedores, VendedorOption } from "../services/api/getVentasLocales";

interface UseGetVendedoresReturn {
  vendedores: VendedorOption[];
  loading: boolean;
  error: string | null;
}

let vendedoresCache: VendedorOption[] | null = null;
let cachePromise: Promise<VendedorOption[]> | null = null;

const useGetVendedores = (): UseGetVendedoresReturn => {
  const [vendedores, setVendedores] = useState<VendedorOption[]>(vendedoresCache || []);
  const [loading, setLoading] = useState<boolean>(!vendedoresCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (vendedoresCache) {
        setVendedores(vendedoresCache);
        setLoading(false);
        return;
      }

      if (!cachePromise) {
        cachePromise = getVendedores()
          .then((data) => {
            vendedoresCache = data;
            return data;
          })
          .finally(() => {
            cachePromise = null;
          });
      }

      try {
        setLoading(true);
        const data = await cachePromise;
        setVendedores(data || vendedoresCache || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar vendedores");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { vendedores, loading, error };
};

export default useGetVendedores;
