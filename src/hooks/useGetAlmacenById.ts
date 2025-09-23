import { useState, useEffect } from "react";
import { URL_API } from "../constants/api";

export interface AlmacenInfo {
  ALMACEN_ID: number;
  ALMACEN: string;
  EXISTENCIAS: number;
}

export interface ArticuloAlmacen {
  ARTICULO_ID: number;
  ARTICULO: string;
  EXISTENCIAS: number;
  LINEA_ARTICULO_ID: number;
  LINEA_ARTICULO: string;
  PRECIOS: string;
}

interface AlmacenResponse {
  error: string;
  body: {
    ARTICULOS: ArticuloAlmacen[];
    ALMACEN: AlmacenInfo;
  };
}

interface UseGetAlmacenByIdReturn {
  almacen: AlmacenInfo | null;
  articulos: ArticuloAlmacen[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useGetAlmacenById = (almacenId: number | null): UseGetAlmacenByIdReturn => {
  const [almacen, setAlmacen] = useState<AlmacenInfo | null>(null);
  const [articulos, setArticulos] = useState<ArticuloAlmacen[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlmacen = async () => {
    if (!almacenId) {
      setAlmacen(null);
      setArticulos([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${URL_API}/almacenes/${almacenId}`);
      const data: AlmacenResponse = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      // Extraer el almacén y los artículos del body
      if (data.body && data.body.ALMACEN) {
        setAlmacen(data.body.ALMACEN);
        setArticulos(data.body.ARTICULOS || []);
      } else {
        setAlmacen(null);
        setArticulos([]);
      }
    } catch (err) {
      console.error("Error fetching almacen:", err);
      setError(err instanceof Error ? err.message : "Error al cargar almacén");
      setAlmacen(null);
      setArticulos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlmacen();
  }, [almacenId]);

  return { almacen, articulos, loading, error, refetch: fetchAlmacen };
};

export default useGetAlmacenById;