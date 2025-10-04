import { useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import Navigation from "../../components/Navigation";
import useGetVentasLocales from "../../hooks/useGetVentasLocales";
import useGetResumenVentas from "../../hooks/useGetResumenVentas";
import VentaDetalleModal from "./VentaDetalleModal";
import { VentaLocal } from "../../services/api/getVentasLocales";
import useGetAlmacenes from "../../hooks/useGetAlmacenes";

dayjs.extend(relativeTime);
dayjs.locale("es");

const VentasLocales = () => {
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    nombreCliente: "",
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState("");

  const { ventas, loading, error } = useGetVentasLocales(filters);
  const { resumen } = useGetResumenVentas(filters.fechaInicio, filters.fechaFin);
  const { getAlmacenById, loading: loadingAlmacenes } = useGetAlmacenes();

  const filteredVentas = useMemo(() => {
    if (!searchTerm) return ventas;
    return ventas.filter(venta => 
      venta.NOMBRE_CLIENTE.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.LOCAL_SALE_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.TELEFONO?.includes(searchTerm)
    );
  }, [ventas, searchTerm]);

  const handleSearch = useCallback(() => {
    setFilters(tempFilters);
  }, [tempFilters]);

  const handleReset = useCallback(() => {
    const resetFilters = {
      fechaInicio: "",
      fechaFin: "",
      nombreCliente: "",
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setSearchTerm("");
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getPaymentStatusColor = (frec: string | undefined) => {
    switch(frec) {
      case "SEMANAL": return "bg-gradient-to-r from-blue-500 to-blue-600";
      case "QUINCENAL": return "bg-gradient-to-r from-purple-500 to-purple-600";
      case "MENSUAL": return "bg-gradient-to-r from-green-500 to-green-600";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  // Componente para el badge del almacén
  const AlmacenBadge = ({ almacenId, compact = false }: { almacenId: number; compact?: boolean }) => {
    const almacen = getAlmacenById(almacenId);

    const baseClassName = compact
      ? "inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
      : "inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600";

    const maxWidth = compact ? "max-w-[120px]" : "max-w-[160px]";

    if (loadingAlmacenes) {
      return <span className={`${baseClassName} ${maxWidth}`}>...</span>;
    }

    const displayText = almacen ? almacen.ALMACEN : `ALM ${almacenId}`;

    return (
      <span className={`${baseClassName} ${maxWidth}`} title={displayText}>
        <span className="truncate">{displayText}</span>
      </span>
    );
  };

  const VentaCard = ({ venta }: { venta: VentaLocal }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className={`group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 transform ${
          isHovered ? "scale-[1.02] -translate-y-1" : ""
        } cursor-pointer overflow-hidden`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          setSelectedVentaId(venta.LOCAL_SALE_ID);
          setShowDetalleModal(true);
        }}
      >
        {/* Barra de color superior con gradiente */}
        <div className={`h-2 ${getPaymentStatusColor(venta.FREC_PAGO)}`} />
        
        {/* Contenido de la tarjeta */}
        <div className="p-6">
          {/* Header con ID y fecha */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Venta</p>
              <p className="text-xs font-semibold text-gray-700 mt-1 font-mono">#{venta.LOCAL_SALE_ID}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{dayjs(venta.FECHA_VENTA).format("DD MMM")}</p>
              <p className="text-xs text-gray-400">{dayjs(venta.FECHA_VENTA).format("HH:mm")}</p>
            </div>
          </div>

          {/* Cliente */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
              {venta.NOMBRE_CLIENTE}
            </h3>
            {venta.TELEFONO && (
              <div className="flex items-center gap-2 mt-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a 
                  href={`tel:${venta.TELEFONO}`} 
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {venta.TELEFONO}
                </a>
              </div>
            )}
          </div>

          {/* Dirección */}
          <div className="mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-gray-600 line-clamp-2">{venta.DIRECCION}</p>
            </div>
          </div>

          {/* Separador con animación */}
          <div className="relative h-px bg-gray-200 my-4 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000`} />
          </div>

          {/* Información financiera */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(venta.PRECIO_TOTAL)}</p>
            </div>
            {venta.ENGANCHE && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Enganche</p>
                <p className="text-lg font-semibold text-gray-700">{formatCurrency(venta.ENGANCHE)}</p>
              </div>
            )}
          </div>

          {/* Badges de información */}
          <div className="flex flex-wrap gap-2">
            {venta.FREC_PAGO && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getPaymentStatusColor(venta.FREC_PAGO)}`}>
                {venta.FREC_PAGO}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              venta.TIPO_VENTA === 'CREDITO'
                ? 'bg-orange-100 text-orange-700'
                : venta.TIPO_VENTA === 'CONTADO'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {venta.TIPO_VENTA || 'SIN TIPO'}
            </span>
            <AlmacenBadge almacenId={venta.ALMACEN_ID} />
          </div>

          {/* Vendedor */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {venta.USER_EMAIL.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{venta.USER_EMAIL}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Efecto de brillo al hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000 pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header elegante con glassmorphism */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-30">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Ventas Locales
              </h1>
              <p className="text-sm text-gray-500 mt-2">Sistema de consulta y gestión de ventas</p>
            </div>
            
            {/* KPIs con animación */}
            {resumen && (
              <div className="flex gap-8">
                <div className="text-center group cursor-pointer">
                  <div className="transform transition-transform group-hover:scale-110">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                      {resumen.TOTAL_VENTAS}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total Ventas</p>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="transform transition-transform group-hover:scale-110">
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                      {formatCurrency(resumen.MONTO_TOTAL)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Monto Total</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barra de filtros moderna */}
        <div className="px-6 pb-5">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-5 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Búsqueda instantánea */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por cliente, ID o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Fecha inicio */}
              <div>
                <input
                  type="date"
                  value={tempFilters.fechaInicio}
                  onChange={(e) => setTempFilters({ ...tempFilters, fechaInicio: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Fecha fin */}
              <div>
                <input
                  type="date"
                  value={tempFilters.fechaFin}
                  onChange={(e) => setTempFilters({ ...tempFilters, fechaFin: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-medium shadow-lg shadow-blue-500/25 transform hover:scale-[1.02]"
                >
                  Aplicar
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  title="Limpiar filtros"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Toggle de vista */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Mostrando {filteredVentas.length} resultados</span>
              </div>
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-md transition-all ${
                    viewMode === "grid" 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-md transition-all ${
                    viewMode === "list" 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-6 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-700 font-medium">Error al cargar las ventas</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
            </div>
            <p className="mt-6 text-gray-600 animate-pulse">Cargando ventas...</p>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                {filteredVentas.map((venta, index) => (
                  <div
                    key={venta.LOCAL_SALE_ID}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <VentaCard venta={venta} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {filteredVentas.map((venta, index) => (
                  <div
                    key={venta.LOCAL_SALE_ID}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all p-4 cursor-pointer group animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => {
                      setSelectedVentaId(venta.LOCAL_SALE_ID);
                      setShowDetalleModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Información izquierda */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Indicador de fecha compacto */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 min-w-[60px] text-center">
                          <p className="text-lg font-bold text-blue-600 leading-none">{dayjs(venta.FECHA_VENTA).format("DD")}</p>
                          <p className="text-xs text-blue-500 uppercase leading-none mt-0.5">{dayjs(venta.FECHA_VENTA).format("MMM")}</p>
                        </div>

                        {/* Información del cliente */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {venta.NOMBRE_CLIENTE}
                            </h3>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {venta.TELEFONO && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <span className="text-xs text-gray-600">{venta.TELEFONO}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                {venta.FREC_PAGO && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getPaymentStatusColor(venta.FREC_PAGO)}`}>
                                    {venta.FREC_PAGO}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  venta.TIPO_VENTA === 'CREDITO'
                                    ? 'bg-orange-100 text-orange-700'
                                    : venta.TIPO_VENTA === 'CONTADO'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {venta.TIPO_VENTA || 'SIN TIPO'}
                                </span>
                                <AlmacenBadge almacenId={venta.ALMACEN_ID} compact />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate max-w-md">{venta.DIRECCION}</span>
                            </div>
                            <div className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500 flex items-center gap-1">
                              <span title={venta.LOCAL_SALE_ID}>#{venta.LOCAL_SALE_ID.slice(0, 6)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Información financiera derecha más compacta */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600 leading-none">{formatCurrency(venta.PRECIO_TOTAL)}</p>
                          {(venta.ENGANCHE || venta.PARCIALIDAD) && (
                            <div className="flex items-center gap-3 mt-1">
                              {venta.ENGANCHE && (
                                <span className="text-xs text-gray-500">
                                  E: <span className="font-semibold text-gray-700">{formatCurrency(venta.ENGANCHE)}</span>
                                </span>
                              )}
                              {venta.PARCIALIDAD && (
                                <span className="text-xs text-gray-500">
                                  P: <span className="font-semibold text-gray-700">{formatCurrency(venta.PARCIALIDAD)}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Vendedor info más compacto */}
                        <div className="border-l border-gray-200 pl-4 w-[100px] flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">
                                {venta.USER_EMAIL.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate" title={venta.USER_EMAIL}>
                              {venta.USER_EMAIL.split('@')[0]}
                            </p>
                          </div>
                        </div>

                        {/* Flecha indicadora */}
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredVentas.length === 0 && (
              <div className="text-center py-20">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg">No se encontraron ventas</p>
                <p className="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalle */}
      {showDetalleModal && selectedVentaId && (
        <VentaDetalleModal
          ventaId={selectedVentaId}
          onClose={() => {
            setShowDetalleModal(false);
            setSelectedVentaId(null);
          }}
        />
      )}

      {/* Navegación */}
      <Navigation />

      {/* Estilos de animación */}
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
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default VentasLocales;