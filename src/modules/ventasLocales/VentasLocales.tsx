import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import useGetVentasLocales from "@/hooks/useGetVentasLocales";
import useGetAlmacenes from "@/hooks/useGetAlmacenes";
import useGetZonasCliente from "@/hooks/useGetZonasCliente";
import useGetVendedores from "@/hooks/useGetVendedores";
import { VentaDetalleModal } from "./components/detalle";
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
import {
  loadDensity,
  saveDensity,
  Density,
  loadPinnedColumns,
  savePinnedColumns,
  MAX_PINNED,
} from "./components/columns";
import { VentasDensityToggle } from "./components/VentasDensityToggle";
import {
  VentaView,
  PRESET_VIEWS,
  loadCustomViews,
  saveCustomViews,
  loadActiveViewId,
  saveActiveViewId,
} from "./components/views";
import { VentasViewSwitcher } from "./components/VentasViewSwitcher";

export default function VentasLocales() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal state
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  // Open modal from notification deep link
  const ventaIdParam = searchParams.get("ventaId");
  useEffect(() => {
    if (ventaIdParam) {
      setSelectedVentaId(ventaIdParam);
      setShowDetalleModal(true);
      setSearchParams((prev) => {
        prev.delete("ventaId");
        return prev;
      }, { replace: true });
    }
  }, [ventaIdParam, setSearchParams]);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(loadVisibleColumns);

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(loadColumnWidths);

  // Density state
  const [density, setDensity] = useState<Density>(loadDensity);

  // Pinned columns state
  const [pinnedColumns, setPinnedColumns] = useState<ColumnId[]>(loadPinnedColumns);

  // Saved views state
  const [customViews, setCustomViews] = useState<VentaView[]>(loadCustomViews);
  const [activeViewId, setActiveViewIdState] = useState<string | null>(loadActiveViewId);


  // Save column preferences when they change
  useEffect(() => {
    saveVisibleColumns(visibleColumns);
  }, [visibleColumns]);

  useEffect(() => {
    saveColumnWidths(columnWidths);
  }, [columnWidths]);

  useEffect(() => {
    saveDensity(density);
  }, [density]);

  useEffect(() => {
    savePinnedColumns(pinnedColumns);
  }, [pinnedColumns]);

  useEffect(() => {
    saveCustomViews(customViews);
  }, [customViews]);

  useEffect(() => {
    saveActiveViewId(activeViewId);
  }, [activeViewId]);

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
  const { vendedores: vendedoresOptions } = useGetVendedores();

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
      vendedorEmails: undefined,
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

  const handleTogglePin = useCallback((id: ColumnId) => {
    setPinnedColumns((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_PINNED) return prev;
      return [...prev, id];
    });
  }, []);

  // Views derived state
  const allViews = useMemo(
    () => [...PRESET_VIEWS, ...customViews],
    [customViews]
  );
  const activeView = useMemo(
    () => allViews.find((v) => v.id === activeViewId) ?? null,
    [allViews, activeViewId]
  );
  const hasUnsavedChanges = useMemo(() => {
    if (!activeView) return false;
    const cols = JSON.stringify(visibleColumns) !== JSON.stringify(activeView.visibleColumns);
    const pinned = JSON.stringify(pinnedColumns) !== JSON.stringify(activeView.pinnedColumns);
    const den = density !== activeView.density;
    const sit = (params.situacion ?? null) !== (activeView.filters?.situacion ?? null);
    const sinc = (params.sincronizacion ?? null) !== (activeView.filters?.sincronizacion ?? null);
    const tipo = (params.tipoVenta ?? null) !== (activeView.filters?.tipoVenta ?? null);
    const inc = (params.incluirCanceladas ?? false) !== (activeView.filters?.incluirCanceladas ?? false);
    const sortChanged =
      (params.sortBy ?? null) !== (activeView.sort?.by ?? null) ||
      (params.sortOrder ?? null) !== (activeView.sort?.order ?? null);
    return cols || pinned || den || sit || sinc || tipo || inc || sortChanged;
  }, [activeView, visibleColumns, pinnedColumns, density, params]);

  const handleSelectView = useCallback(
    (id: string) => {
      const v = allViews.find((x) => x.id === id);
      if (!v) return;
      setVisibleColumns([...v.visibleColumns]);
      setPinnedColumns([...v.pinnedColumns]);
      setDensity(v.density);
      if (Object.keys(v.columnWidths).length > 0) {
        setColumnWidths((prev) => ({ ...prev, ...v.columnWidths }));
      }
      // All filters + sort → merge into params (all server-side now)
      setParams({
        tipoVenta: v.filters?.tipoVenta,
        incluirCanceladas: v.filters?.incluirCanceladas,
        situacion: v.filters?.situacion,
        sincronizacion: v.filters?.sincronizacion,
        sortBy: v.sort?.by,
        sortOrder: v.sort?.order,
        cursor: undefined,
      });
      setActiveViewIdState(id);
    },
    [allViews, setParams]
  );

  // Apply persisted active view once on mount (re-syncs filters + sort)
  const initialViewAppliedRef = useRef(false);
  useEffect(() => {
    if (!initialViewAppliedRef.current && activeViewId) {
      handleSelectView(activeViewId);
      initialViewAppliedRef.current = true;
    }
  }, [activeViewId, handleSelectView]);

  const handleSaveAsNew = useCallback(
    (name: string) => {
      const newView: VentaView = {
        id: crypto.randomUUID(),
        name,
        visibleColumns: [...visibleColumns],
        pinnedColumns: [...pinnedColumns],
        columnWidths: { ...columnWidths },
        density,
        filters: {
          tipoVenta: params.tipoVenta,
          incluirCanceladas: params.incluirCanceladas,
          situacion: params.situacion,
          sincronizacion: params.sincronizacion,
        },
        sort: params.sortBy ? { by: params.sortBy, order: params.sortOrder } : undefined,
      };
      setCustomViews((prev) => [...prev, newView]);
      setActiveViewIdState(newView.id);
      toast.success(`Vista "${name}" guardada`);
    },
    [visibleColumns, pinnedColumns, columnWidths, density, params]
  );

  const handleDeleteView = useCallback(
    (id: string) => {
      setCustomViews((prev) => prev.filter((v) => v.id !== id));
      if (activeViewId === id) setActiveViewIdState(null);
    },
    [activeViewId]
  );

  const handleRenameView = useCallback((id: string, newName: string) => {
    setCustomViews((prev) =>
      prev.map((v) => (v.id === id ? { ...v, name: newName } : v))
    );
  }, []);

  const handleResetToView = useCallback(() => {
    if (activeView) handleSelectView(activeView.id);
  }, [activeView, handleSelectView]);

  // Check if any filters are applied
  const hasFilters = useMemo(() => {
    return !!(
      params.search ||
      params.fechaInicio ||
      params.fechaFin ||
      params.tipoVenta ||
      params.almacenId ||
      params.zonaClienteId ||
      params.vendedorEmails ||
      params.precioMin ||
      params.precioMax
    );
  }, [params]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="shrink-0 bg-background border-b border-border/40">
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
              <VentasViewSwitcher
                activeViewId={activeViewId}
                views={allViews}
                hasUnsavedChanges={hasUnsavedChanges}
                onSelectView={handleSelectView}
                onSaveAsNew={handleSaveAsNew}
                onDeleteView={handleDeleteView}
                onRenameView={handleRenameView}
                onResetToView={handleResetToView}
              />
              <VentasFilters
                params={params}
                onParamsChange={setParams}
                almacenes={almacenes}
                zonas={zonas}
                vendedores={vendedoresOptions}
              />
              <VentasDensityToggle density={density} onChange={setDensity} />
              <VentasColumnSelector
                visibleColumns={visibleColumns}
                onChange={setVisibleColumns}
                pinnedColumns={pinnedColumns}
                onTogglePin={handleTogglePin}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-h-0">
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
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            onColumnResize={handleColumnResize}
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSort={updateSort}
            onViewDetails={handleViewDetails}
            getAlmacenName={getAlmacenName}
            density={density}
            infiniteScroll={{
              hasMore,
              isLoading: loadingMore,
              onLoadMore: loadMore,
            }}
          />
        )}
      </div>

      {/* Detail Modal */}
      {showDetalleModal && selectedVentaId && (
        <VentaDetalleModal ventaId={selectedVentaId} onClose={handleCloseModal} />
      )}
    </div>
  );
}
