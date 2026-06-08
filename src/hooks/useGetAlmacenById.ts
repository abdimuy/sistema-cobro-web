import { useState, useEffect } from "react";
import { URL_API_V2 } from "../constants/api";
import { auth } from "../../firebase";

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

// Wire shapes returned by the Go backend (snake_case). Translated below
// into the UPPER_SNAKE_CASE the rest of the app already consumes — the
// 20+ downstream components keep working untouched.
interface AlmacenInfoWire {
  almacen_id: number;
  almacen: string;
  existencias: number;
}

interface ArticuloAlmacenWire {
  articulo_id: number;
  articulo: string;
  existencias: number;
  linea_articulo_id: number;
  linea_articulo: string;
  precios: string;
}

interface ArticulosResponse {
  items: ArticuloAlmacenWire[];
}

interface UseGetAlmacenByIdReturn {
  almacen: AlmacenInfo | null;
  articulos: ArticuloAlmacen[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fromAlmacenWire = (w: AlmacenInfoWire): AlmacenInfo => ({
  ALMACEN_ID: w.almacen_id,
  ALMACEN: w.almacen,
  EXISTENCIAS: w.existencias,
});

const fromArticuloWire = (w: ArticuloAlmacenWire): ArticuloAlmacen => ({
  ARTICULO_ID: w.articulo_id,
  ARTICULO: w.articulo,
  EXISTENCIAS: w.existencias,
  LINEA_ARTICULO_ID: w.linea_articulo_id,
  LINEA_ARTICULO: w.linea_articulo,
  PRECIOS: w.precios,
});

const useGetAlmacenById = (almacenId: number | null, comparation: string = ""): UseGetAlmacenByIdReturn => {
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

      const headers = await authHeaders();
      const buscarParam = comparation ? `?buscar=${encodeURIComponent(comparation)}` : "";

      // Two parallel fetches: almacen info + articulos. The legacy v1
      // endpoint returned both in one response; the v2 backend splits
      // them so each remains a clean read-only endpoint.
      const [almacenRes, articulosRes] = await Promise.all([
        fetch(`${URL_API_V2}/v2/almacenes/${almacenId}`, { headers }),
        fetch(`${URL_API_V2}/v2/almacenes/${almacenId}/articulos${buscarParam}`, { headers }),
      ]);

      if (!almacenRes.ok) {
        if (almacenRes.status === 404) {
          setError("Almacén no encontrado");
        } else {
          setError(`HTTP error! status: ${almacenRes.status}`);
        }
        setAlmacen(null);
        setArticulos([]);
        return;
      }
      if (!articulosRes.ok) {
        setError(`HTTP error! status: ${articulosRes.status}`);
        setAlmacen(null);
        setArticulos([]);
        return;
      }

      const almacenWire: AlmacenInfoWire = await almacenRes.json();
      const articulosData: ArticulosResponse = await articulosRes.json();

      setAlmacen(fromAlmacenWire(almacenWire));
      setArticulos((articulosData.items || []).map(fromArticuloWire));
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
  }, [almacenId, comparation]);

  return { almacen, articulos, loading, error, refetch: fetchAlmacen };
};

export default useGetAlmacenById;
