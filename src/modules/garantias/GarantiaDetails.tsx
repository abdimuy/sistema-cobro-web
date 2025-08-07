import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { URL_API } from "../../constants/api";
import getVenta, { Venta } from "../../services/api/getVenta";
import { Garantia } from "./Garantias";
import useGetEventosByGarantia from "../../hooks/useGetEventosByGarantia";
import dayjs from "dayjs";
import useGetProductsSaleByFolio from "../../hooks/useGetProductsSaleByFolio";
import useGetImagesByGarantia from "../../hooks/useGetImagesByGarantia";
import { ImageGarantia } from "../../services/api/getImagesByGarantia";
import createEventoGarantia, {
  AllowedEstadosDesktop,
} from "../../services/api/createEventoGarantia";

const GarantiaDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [garantia, setGarantia] = useState<Garantia | null>(null);
  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<
    (typeof AllowedEstadosDesktop)[number]
  >(AllowedEstadosDesktop[0]);
  const [nuevaObservacion, setNuevaObservacion] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [imagenGrande, setImagenGrande] = useState<ImageGarantia | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const { eventos, refetch: refetchEventos } = useGetEventosByGarantia(
    garantia?.ID || 0
  );
  const { products, loading: loadingProductos } = useGetProductsSaleByFolio(
    venta?.FOLIO || ""
  );
  const { images, loading: loadingImages } = useGetImagesByGarantia(
    garantia?.ID || 0
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
      .get<{ body: Garantia }>(`${URL_API}/garantias/${id}`)
      .then(async (response) => {
        console.log("Garantía cargada:", response.data.body);
        setGarantia(response.data.body);
        const ventaData = await getVenta(response.data.body.DOCTO_CC_ID);
        setVenta(ventaData);
      })
      .catch(() => setError("No se pudo cargar la garantía"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAgregarEvento = async () => {
    if (!garantia) return;
    setAgregando(true);
    try {
      await createEventoGarantia(garantia.EXTERNAL_ID, {
        tipoEvento: nuevoEstado,
        fechaEvento: new Date().toISOString(),
        comentario: nuevaObservacion,
      });
      setShowModal(false);
      setNuevaObservacion("");
      setNuevoEstado(AllowedEstadosDesktop[0]);
      setMensajeExito("¡Evento agregado con éxito!");
      setTimeout(() => setMensajeExito(null), 3000);
      await refetchEventos();
    } catch {
      alert("No se pudo agregar el evento");
    } finally {
      setAgregando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        Cargando detalles de la garantía...
      </div>
    );
  }

  if (error || !garantia) {
    return (
      <div className="text-red-500 text-center mt-4">
        {error || "Garantía no encontrada"}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-black">
      <button
        className="mb-4 text-blue-600 hover:underline"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>
      <h1 className="text-2xl font-bold mb-4 text-black text-center">
        Detalles de la Garantía #{garantia.ID}
      </h1>
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <span className="font-semibold">Fecha solicitud:</span>{" "}
            {new Date(garantia.FECHA_SOLICITUD).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">Estado:</span>{" "}
            <span className="capitalize">{garantia.ESTADO}</span>
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold">Falla reportada:</span>{" "}
            {garantia.DESCRIPCION_FALLA}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold">Observaciones:</span>{" "}
            {garantia.OBSERVACIONES || "-"}
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2 text-black">Datos del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-semibold">Cliente:</span> {venta?.CLIENTE}
          </div>
          <div>
            <span className="font-semibold">Teléfono:</span> {venta?.TELEFONO}
          </div>
          <div>
            <span className="font-semibold">Dirección:</span> {venta?.CALLE},{" "}
            {venta?.CIUDAD}
          </div>
          <div>
            <span className="font-semibold">Vendedor:</span> {venta?.VENDEDOR_1}
          </div>
        </div>
      </div>

      {/* Sección de productos */}
      <h2 className="text-xl font-bold mt-8 mb-4 text-black text-center">
        Productos de la Venta
      </h2>
      <div className="bg-white rounded-xl shadow p-4 max-w-2xl mx-auto mb-8">
        {loadingProductos ? (
          <div className="text-gray-400">Cargando productos...</div>
        ) : products && products.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2 border-b">Clave</th>
                <th className="py-2 px-2 border-b">Descripción</th>
                <th className="py-2 px-2 border-b">Cantidad</th>
                <th className="py-2 px-2 border-b">Precio</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.ARTICULO_ID}>
                  <td className="py-1 px-2 border-b">{prod.FOLIO}</td>
                  <td className="py-1 px-2 border-b">{prod.ARTICULO}</td>
                  <td className="py-1 px-2 border-b">{prod.CANTIDAD}</td>
                  <td className="py-1 px-2 border-b">
                    ${prod.PRECIO_UNITARIO_IMPTO?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-500">
            No hay productos asociados a esta venta.
          </div>
        )}
      </div>

      {/* Sección de imágenes */}
      <h2 className="text-xl font-bold mt-8 mb-4 text-black text-center">
        Imágenes asociadas
      </h2>
      <div className="bg-white rounded-xl shadow p-4 max-w-2xl mx-auto mb-8">
        {loadingImages ? (
          <div className="text-gray-400">Cargando imágenes...</div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img: ImageGarantia) => (
              <div key={img.ID} className="flex flex-col items-center">
                <img
                  src={`${URL_API}${img.IMG_PATH}`}
                  alt={`Imagen ${img.ID}`}
                  className="w-full h-32 object-cover rounded mb-2 border cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setImagenGrande(img)}
                />
                <span className="text-xs text-gray-600">{img.IMG_DESC}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">
            No hay imágenes asociadas a esta garantía.
          </div>
        )}
      </div>

      {/* Modal para imagen grande */}
      {imagenGrande && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setImagenGrande(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-4 max-w-3xl w-full flex flex-col items-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-700 hover:text-black text-2xl"
              onClick={() => setImagenGrande(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <img
              src={`${URL_API}${imagenGrande.IMG_PATH}`}
              alt={imagenGrande.IMG_DESC || "Imagen de garantía"}
              className="max-h-[70vh] max-w-[90vw] min-h-[300px] min-w-[300px] w-auto rounded mb-2"
            />
            <span className="text-base text-gray-700">
              {imagenGrande.IMG_DESC}
            </span>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mt-8 mb-4 text-black text-center">
        Eventos de la Garantía
      </h2>
      <div className="flex justify-center mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          + Agregar evento
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
        {eventos.map((evento) => (
          <div key={evento.ID} className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold">{evento.TIPO_EVENTO}</h3>
            <p>
              <strong>Fecha:</strong>{" "}
              {dayjs(evento.FECHA_EVENTO).format("DD/MM/YYYY hh:mm A")}
            </p>
            <p>
              <strong>Comentario:</strong> {evento.COMENTARIO || "-"}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Agregar nuevo evento</h3>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Nuevo estado</label>
              <select
                onChange={(e) =>
                  setNuevoEstado(
                    e.target.value as (typeof AllowedEstadosDesktop)[number]
                  )
                }
                value={nuevoEstado}
                className="w-full border rounded px-2 py-1 bg-white"
              >
                {AllowedEstadosDesktop.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">
                Observación (opcional)
              </label>
              <textarea
                className="w-full border rounded px-2 py-1 bg-white"
                value={nuevaObservacion}
                onChange={(e) => setNuevaObservacion(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowModal(false)}
                disabled={agregando}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleAgregarEvento}
                disabled={agregando}
              >
                {agregando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {mensajeExito && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4 text-center font-semibold">
          {mensajeExito}
        </div>
      )}
    </div>
  );
};

export default GarantiaDetalle;
