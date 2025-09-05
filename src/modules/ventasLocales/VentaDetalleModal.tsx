import { useState, useEffect } from "react";
import dayjs from "dayjs";
import useGetVentaLocalCompleta from "../../hooks/useGetVentaLocalCompleta";
import { getImageUrl } from "../../services/api/getVentasLocales";
import MapSimple from "../../components/MapSimple";

interface VentaDetalleModalProps {
  ventaId: string;
  onClose: () => void;
}

const VentaDetalleModal = ({ ventaId, onClose }: VentaDetalleModalProps) => {
  const { venta, loading, error } = useGetVentaLocalCompleta(ventaId);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "productos" | "imagenes">("info");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-600">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-2xl p-8 max-w-md">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold text-gray-900 mb-2">Error al cargar la venta</p>
            <p className="text-gray-600 mb-6">{error || "No se pudo cargar la información"}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal principal */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
          {/* Header del modal */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Detalle de Venta</h2>
                <p className="text-blue-100 mt-1">ID: {venta.LOCAL_SALE_ID}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === "info" 
                    ? "text-blue-600 bg-white" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Información General
                {activeTab === "info" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("productos")}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === "productos" 
                    ? "text-blue-600 bg-white" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Productos ({venta.productos?.length || 0})
                {activeTab === "productos" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("imagenes")}
                className={`px-6 py-3 font-medium transition-all relative ${
                  activeTab === "imagenes" 
                    ? "text-blue-600 bg-white" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Imágenes ({venta.imagenes?.length || 0})
                {activeTab === "imagenes" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Contenido del modal */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
            {/* Tab de Información General */}
            {activeTab === "info" && (
              <div className="space-y-6 animate-fade-in">
                {/* Información del cliente */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Información del Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="font-semibold text-gray-900">{venta.NOMBRE_CLIENTE}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <a href={`tel:${venta.TELEFONO}`} className="font-semibold text-blue-600 hover:underline">
                        {venta.TELEFONO || "No registrado"}
                      </a>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="font-semibold text-gray-900">{venta.DIRECCION}</p>
                    </div>
                    {venta.AVAL_O_RESPONSABLE && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Aval o Responsable</p>
                        <p className="font-semibold text-gray-900">{venta.AVAL_O_RESPONSABLE}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información financiera */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Información Financiera
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-500">Precio Total</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(venta.PRECIO_TOTAL)}</p>
                    </div>
                    {venta.ENGANCHE !== undefined && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-500">Enganche</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(venta.ENGANCHE || 0)}</p>
                      </div>
                    )}
                    {venta.PARCIALIDAD !== undefined && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-500">Parcialidad</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(venta.PARCIALIDAD || 0)}</p>
                      </div>
                    )}
                    {venta.MONTO_A_CORTO_PLAZO !== undefined && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-500">Monto a Corto Plazo</p>
                        <p className="text-xl font-bold text-gray-700">{formatCurrency(venta.MONTO_A_CORTO_PLAZO || 0)}</p>
                      </div>
                    )}
                    {venta.TIEMPO_A_CORTO_PLAZOMESES !== undefined && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-500">Plazo</p>
                        <p className="text-xl font-bold text-gray-700">{venta.TIEMPO_A_CORTO_PLAZOMESES} meses</p>
                      </div>
                    )}
                    {venta.FREC_PAGO && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-500">Frecuencia de Pago</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {venta.FREC_PAGO}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalles adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Venta</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Fecha de Venta</p>
                        <p className="font-semibold text-gray-900">{dayjs(venta.FECHA_VENTA).format("DD/MM/YYYY HH:mm")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Vendedor</p>
                        <p className="font-semibold text-gray-900">{venta.USER_EMAIL}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Almacén</p>
                        <p className="font-semibold text-gray-900">ID: {venta.ALMACEN_ID}</p>
                      </div>
                      {venta.DIA_COBRANZA && (
                        <div>
                          <p className="text-sm text-gray-500">Día de Cobranza</p>
                          <p className="font-semibold text-gray-900">{venta.DIA_COBRANZA}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {venta.NOTA && (
                    <div className="bg-yellow-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Notas
                      </h3>
                      <p className="text-gray-700">{venta.NOTA}</p>
                    </div>
                  )}
                </div>

                {/* Ubicación */}
                {venta.LATITUD && venta.LONGITUD && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ubicación
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Coordenadas</p>
                          <p className="font-semibold text-gray-900">{venta.LATITUD}, {venta.LONGITUD}</p>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${venta.LATITUD},${venta.LONGITUD}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Ver en Google Maps
                        </a>
                      </div>
                      {/* Mapa integrado */}
                      <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                        <MapSimple 
                          point={{ lat: Number(venta.LATITUD), lng: Number(venta.LONGITUD) }} 
                          height="256px"
                          zoom={16}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab de Productos */}
            {activeTab === "productos" && (
              <div className="animate-fade-in">
                {venta.productos && venta.productos.length > 0 ? (
                  <div className="space-y-4">
                    {venta.productos.map((producto, index) => (
                      <div 
                        key={index} 
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{producto.ARTICULO}</h4>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-gray-500">ID: {producto.ARTICULO_ID}</span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                Cantidad: {producto.CANTIDAD}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Lista</p>
                                <p className="font-semibold text-gray-900">{formatCurrency(producto.PRECIO_LISTA)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Corto Plazo</p>
                                <p className="font-semibold text-blue-600">{formatCurrency(producto.PRECIO_CORTO_PLAZO)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Contado</p>
                                <p className="font-semibold text-green-600">{formatCurrency(producto.PRECIO_CONTADO)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Resumen de productos */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total de Productos</p>
                          <p className="text-2xl font-bold text-gray-900">{venta.productos.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Unidades Totales</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {venta.productos.reduce((sum, p) => sum + p.CANTIDAD, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-500">No hay productos registrados</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab de Imágenes */}
            {activeTab === "imagenes" && (
              <div className="animate-fade-in">
                {/* Debug info - remover en producción */}
                {venta.imagenes && venta.imagenes.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs space-y-1">
                    <p><strong>Debug:</strong> Base URL: https://prueba2025.loclx.io</p>
                    <p><strong>Debug:</strong> IMG_PATH: {venta.imagenes[0].IMG_PATH}</p>
                    <p><strong>Debug:</strong> URL completa: {getImageUrl(venta.imagenes[0].IMG_PATH)}</p>
                  </div>
                )}
                
                {venta.imagenes && venta.imagenes.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {venta.imagenes.map((imagen) => (
                      <div 
                        key={imagen.ID}
                        className="group relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                        onClick={() => setSelectedImage(getImageUrl(imagen.IMG_PATH))}
                      >
                        <img
                          src={getImageUrl(imagen.IMG_PATH)}
                          alt={imagen.IMG_DESC}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            console.error('Error loading image:', getImageUrl(imagen.IMG_PATH));
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBWMTMwTTEwMCA3MEw3MCA4NUwxMzAgODVMMTAwIDcwWiIgc3Ryb2tlPSIjOUI5QkE0IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';
                            target.classList.add('opacity-50');
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', getImageUrl(imagen.IMG_PATH));
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <p className="text-sm font-medium">{imagen.IMG_DESC}</p>
                            <p className="text-xs opacity-75">
                              {dayjs(imagen.FECHA_SUBIDA).format("DD/MM/YYYY HH:mm")}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">No hay imágenes disponibles</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default VentaDetalleModal;