import React, { useEffect, useState } from "react";
import axios from "axios";
import { URL_API } from "../../constants/api";
import useGetVenta from "../../hooks/useGetVenta";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "../../components/Navigation";
import useGetProductsSaleByFolio from "../../hooks/useGetProductsSaleByFolio";
import { ProductSale } from "../../services/api/getProductsSaleByFolio";

// Interfaz de datos de garantía
export type Garantia = {
  ID: number;
  DOCTO_CC_ID: number;
  FECHA_SOLICITUD: string;
  DESCRIPCION_FALLA: string;
  ESTADO: string;
  OBSERVACIONES?: string;
  EXTERNAL_ID: string;
  ZONA_CLIENTE_ID: number;
  ZONA_CLIENTE_NOMBRE: string;
};

const GarantiasListPage: React.FC = () => {
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterZona, setFilterZona] = useState(""); // Estado para el filtro
  const navigate = useNavigate();

  useEffect(() => {
    // Reemplaza con tu endpoint real
    axios
      .get<{ body: Garantia[] }>(URL_API + "/garantias/activa")
      .then((response) => {
        console.log("Garantías cargadas:", response.data);
        setGarantias(response.data.body);
      })
      .catch((err) => {
        console.error(err);
        setError("Error al cargar las garantías.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Obtener zonas únicas de las garantías
  const zonasUnicas = Array.from(
    new Set(garantias.map((g) => g.ZONA_CLIENTE_NOMBRE))
  );
  console.log("Zonas únicas:", zonasUnicas);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        Cargando garantías...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-4">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <button
        className="mb-4 text-blue-600 hover:underline"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>
      <h1 className="text-2xl font-bold mb-6 text-black">
        Listado de Garantías
      </h1>
      {/* Select de filtrado por zona cliente */}
      <div className="mb-4">
        <select
          value={filterZona}
          onChange={(e) => setFilterZona(e.target.value)}
          className="border bg-slate-100 text-black rounded px-3 py-2 w-full md:w-1/3"
        >
          <option value="">Todas las zonas</option>
          {zonasUnicas.map((zona) => (
            <option key={zona} value={zona}>
              {zona}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-4">
        {garantias
          .filter((g) =>
            filterZona === "" ? true : g.ZONA_CLIENTE_NOMBRE === filterZona
          )
          .map((g) => (
            <CardGarantia key={g.ID} garantia={g} />
          ))}
      </div>
      
      {/* Navegación profesional */}
      <Navigation />
    </div>
  );
};

function CardGarantia({ garantia }: { garantia: Garantia }) {
  const { venta } = useGetVenta(garantia.DOCTO_CC_ID);
  const { products, loading: loadingProductos } = useGetProductsSaleByFolio(
    venta?.FOLIO || ""
  );
  const zonaCliente = venta?.ZONA_NOMBRE || "";
  return (
    <div key={garantia.ID} className="bg-white rounded-xl shadow px-6 py-4">
      {/* Primera fila: datos de la garantía */}
      <div className="grid grid-cols-1 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-2 items-center">
        <Link
          to={`/garantias/${garantia.ID}`}
          className="font-semibold text-lg text-black truncate"
        >
          #{garantia.ID}
        </Link>
        <span className="text-gray-600 truncate col-span-3">
          <strong>Fecha:</strong>{" "}
          {new Date(garantia.FECHA_SOLICITUD).toLocaleDateString()}
        </span>
        <span className="text-gray-600 truncate col-span-6">
          <strong>Falla:</strong> {garantia.DESCRIPCION_FALLA}
        </span>
        <span className="text-gray-600 truncate col-span-4">
          <strong>Estado:</strong>{" "}
          <span className="capitalize">{garantia.ESTADO}</span>
        </span>
        <span className="text-gray-600 truncate col-span-6">
          <strong>Obs:</strong> {garantia.OBSERVACIONES || "-"}
        </span>
      </div>
      {/* Segunda fila: nombre del cliente, zona y productos */}
      <div className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
        <span className="text-blue-700 font-medium col-span-2 truncate">
          <strong>Cliente:</strong> {venta?.CLIENTE || "Cargando..."}
        </span>
        <span className="text-green-700 font-medium col-span-1 truncate">
          <strong>Zona:</strong> {zonaCliente || "Cargando..."}
        </span>
        <span className="font-semibold col-span-2 text-black">
          Productos:{" "}
          {loadingProductos ? (
            <span className="text-gray-400">Cargando productos...</span>
          ) : products && products.length > 0 ? (
            <div className="text-gray-700">
              {products.map((prod: ProductSale) => (
                <div key={prod.ARTICULO_ID}>
                  {prod.ARTICULO} (x{prod.CANTIDAD})
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">Sin productos</span>
          )}
        </span>
      </div>
    </div>
  );
}

export default GarantiasListPage;
