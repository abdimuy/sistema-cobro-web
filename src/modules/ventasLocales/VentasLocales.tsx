import { useState, useCallback, useMemo, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import useGetVentasLocales from "@/hooks/useGetVentasLocales";
import useGetAlmacenes from "@/hooks/useGetAlmacenes";
import useGetZonasCliente from "@/hooks/useGetZonasCliente";
import VentaDetalleModal from "./VentaDetalleModal";
import {
  VentasSearchBar,
  VentasFilters,
  VentasTable,
  VentasColumnSelector,
  VentasEmptyState,
  VentasErrorState,
  VentasLoadingSkeleton,
  loadVisibleColumns,
  saveVisibleColumns,
  loadColumnWidths,
  saveColumnWidths,
  ColumnId,
  ColumnWidths,
} from "./components";

export default function VentasLocales() {
  // Modal state
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(loadVisibleColumns);

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(loadColumnWidths);

  // Save column preferences when they change
  useEffect(() => {
    saveVisibleColumns(visibleColumns);
  }, [visibleColumns]);

  useEffect(() => {
    saveColumnWidths(columnWidths);
  }, [columnWidths]);

  // Data hooks
  const {
    ventas,
    loading,
    loadingMore,
    error,
    params,
    hasMore,
    setParams,
    updateSort,
    loadMore,
    refetch,
  } = useGetVentasLocales();

  const { almacenes, getAlmacenById } = useGetAlmacenes();
  const { zonas } = useGetZonasCliente();

  // Handlers
  const handleSearch = useCallback(
    (search: string) => {
      setParams({ search: search || undefined });
    },
    [setParams]
  );

  const handleViewDetails = useCallback((ventaId: string) => {
    setSelectedVentaId(ventaId);
    setShowDetalleModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDetalleModal(false);
    setSelectedVentaId(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setParams({
      search: undefined,
      fechaInicio: undefined,
      fechaFin: undefined,
      tipoVenta: undefined,
      almacenId: undefined,
      zonaClienteId: undefined,
      precioMin: undefined,
      precioMax: undefined,
    });
  }, [setParams]);

  const getAlmacenName = useCallback(
    (id: number) => {
      const almacen = getAlmacenById(id);
      return almacen?.ALMACEN || `ALM ${id}`;
    },
    [getAlmacenById]
  );

  const handleColumnResize = useCallback((columnId: ColumnId, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [columnId]: width }));
  }, []);

  // Check if any filters are applied
  const hasFilters = useMemo(() => {
    return !!(
      params.search ||
      params.fechaInicio ||
      params.fechaFin ||
      params.tipoVenta ||
      params.almacenId ||
      params.zonaClienteId ||
      params.precioMin ||
      params.precioMax
    );
  }, [params]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Title Row */}
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-semibold text-foreground">
              Ventas Locales
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4">
            <VentasSearchBar
              value={params.search || ""}
              onSearch={handleSearch}
              className="flex-1 min-w-0"
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <VentasFilters
                params={params}
                onParamsChange={setParams}
                almacenes={almacenes}
                zonas={zonas}
              />
              <VentasColumnSelector
                visibleColumns={visibleColumns}
                onChange={setVisibleColumns}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {error ? (
          <VentasErrorState message={error} onRetry={refetch} />
        ) : loading && ventas.length === 0 ? (
          <VentasLoadingSkeleton rows={12} />
        ) : ventas.length === 0 ? (
          <VentasEmptyState
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <VentasTable
            ventas={ventas}
            visibleColumns={visibleColumns}
            columnWidths={columnWidths}
            onColumnResize={handleColumnResize}
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSort={updateSort}
            onViewDetails={handleViewDetails}
            getAlmacenName={getAlmacenName}
            infiniteScroll={{
              hasMore,
              isLoading: loadingMore,
              onLoadMore: loadMore,
            }}
          />
        )}
      </main>

      {/* Detail Modal */}
      {showDetalleModal && selectedVentaId && (
        <VentaDetalleModal ventaId={selectedVentaId} onClose={handleCloseModal} />
      )}

      {/* Navigation */}
      <Navigation />
    </div>
  );
}
