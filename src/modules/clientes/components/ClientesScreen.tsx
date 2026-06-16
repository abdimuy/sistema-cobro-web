import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SegmentoValue } from "../domain/values/Segmento";
import type { EstadoPagoValue } from "../domain/values/EstadoPago";
import { useBuscarClientes } from "../presentation/hooks/useBuscarClientes";
import { useRefrescarBusqueda } from "../presentation/hooks/useRefrescarBusqueda";
import { ClientesSearchBar } from "./ClientesSearchBar";
import { ClientesFilters } from "./ClientesFilters";
import { ClientesDensityToggle } from "./ClientesDensityToggle";
import { ClientesColumnSelector } from "./ClientesColumnSelector";
import { ClientesTable } from "./ClientesTable";
import { ClientesLoadingSkeleton } from "./ClientesLoadingSkeleton";
import { ClientesEmptyState } from "./ClientesEmptyState";
import { ClientesErrorState } from "./ClientesErrorState";
import {
  loadVisibleColumns,
  saveVisibleColumns,
  loadColumnWidths,
  saveColumnWidths,
  loadDensity,
  saveDensity,
  loadPinnedColumns,
  savePinnedColumns,
  ColumnId,
  ColumnWidths,
  Density,
} from "./columns";
import { cn } from "@/lib/utils";
import type { FilterState } from "./ClientesFilters";

// ClientesScreen is the orchestrator for the clientes directory module.
// It owns all filter, column, and sort state. Data fetching is delegated to
// hooks that read the port from context. Only ClientesContainer touches infra.
export function ClientesScreen() {
  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  // q is set on Enter/click — no debounce needed since the search bar fires
  // onSearch only on commit, not on every keystroke.
  const [q, setQ] = useState("");
  const [segmento, setSegmento] = useState<string | undefined>(undefined);
  const [estadoPago, setEstadoPago] = useState<string | undefined>(undefined);
  const [tierRiesgo, setTierRiesgo] = useState<string | undefined>(undefined);
  const [conSaldo, setConSaldo] = useState<boolean | undefined>(undefined);
  const [scoreMin, setScoreMin] = useState<number | undefined>(undefined);
  const [zonaInput, setZonaInput] = useState<string | undefined>(undefined);
  const [cobradorInput, setCobradorInput] = useState<string | undefined>(undefined);

  // ── Column / density state (load from localStorage) ───────────────────────
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(loadVisibleColumns);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(loadColumnWidths);
  const [density, setDensity] = useState<Density>(loadDensity);
  const [pinnedColumns, setPinnedColumns] = useState<ColumnId[]>(loadPinnedColumns);

  // ── Sort state (server-side) ───────────────────────────────────────────────
  // sortKey holds the API sort_by enum value (columns.ts sortKeys map 1:1 to it).
  // Changing it feeds the data hook, which refetches the server-sorted page.
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("asc");
      return key;
    });
  }, []);

  // ── Data hook ─────────────────────────────────────────────────────────────
  // zona/cobrador are Phase 1 free-text inputs; parse to number for the backend.
  const { items, facets, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } =
    useBuscarClientes({
      q: q || undefined,
      segmento: segmento as SegmentoValue | undefined,
      estadoPago: estadoPago as EstadoPagoValue | undefined,
      tier: tierRiesgo,
      conSaldo,
      scoreMin,
      zona: zonaInput ? parseInt(zonaInput, 10) || undefined : undefined,
      cobrador: cobradorInput ? parseInt(cobradorInput, 10) || undefined : undefined,
      // Sort is server-side: the API sorts the whole matching set and returns the
      // already-sorted page. items below are rendered in the order received.
      sortBy: sortKey ?? undefined,
      sortOrder,
    });

  // ── Derived state ─────────────────────────────────────────────────────────
  const hasFilters = !!(
    q ||
    segmento ||
    estadoPago ||
    tierRiesgo ||
    conSaldo ||
    scoreMin !== undefined ||
    zonaInput ||
    cobradorInput
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setQ("");
    setSegmento(undefined);
    setEstadoPago(undefined);
    setTierRiesgo(undefined);
    setConSaldo(undefined);
    setScoreMin(undefined);
    setZonaInput(undefined);
    setCobradorInput(undefined);
  }, []);

  // ── Filter change dispatcher ───────────────────────────────────────────────
  const handleFiltersChange = useCallback((changes: Partial<FilterState>) => {
    if ("segmento" in changes) setSegmento(changes.segmento);
    if ("estadoPago" in changes) setEstadoPago(changes.estadoPago);
    if ("tierRiesgo" in changes) setTierRiesgo(changes.tierRiesgo);
    if ("conSaldo" in changes) setConSaldo(changes.conSaldo);
    if ("scoreMin" in changes) setScoreMin(changes.scoreMin);
    if ("zonaInput" in changes) setZonaInput(changes.zonaInput);
    if ("cobradorInput" in changes) setCobradorInput(changes.cobradorInput);
  }, []);

  // ── Column handlers ───────────────────────────────────────────────────────
  const handleColumnResize = useCallback((id: ColumnId, width: number) => {
    setColumnWidths((prev) => {
      const next = { ...prev, [id]: width };
      saveColumnWidths(next);
      return next;
    });
  }, []);

  const handleVisibleColumnsChange = useCallback((cols: ColumnId[]) => {
    setVisibleColumns(cols);
    saveVisibleColumns(cols);
  }, []);

  const handleTogglePin = useCallback((id: ColumnId) => {
    setPinnedColumns((prev) => {
      const next = prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id].slice(0, 2);
      savePinnedColumns(next);
      return next;
    });
  }, []);

  const handleDensityChange = useCallback((d: Density) => {
    setDensity(d);
    saveDensity(d);
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigate = useNavigate();
  const handleRowClick = useCallback(
    (clienteId: number) => {
      navigate(`/clientes/${clienteId}`);
    },
    [navigate]
  );

  // ── Reindexar ─────────────────────────────────────────────────────────────
  const { refrescar, isRefreshing } = useRefrescarBusqueda();
  const handleRefrescar = useCallback(async () => {
    await refrescar();
    refresh();
  }, [refrescar, refresh]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1 font-mono">
              Directorio de clientes
            </p>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Clientes
            </h1>
          </div>
          {/* Reindexar — subtle admin action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleRefrescar()}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs mt-1"
            data-testid="reindexar-button"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
            />
            <span className="hidden sm:inline">Reindexar</span>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 flex flex-wrap items-center gap-2 border-b border-border/40">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <ClientesSearchBar
            value={searchInput}
            onSearch={(v) => {
              setSearchInput(v);
              setQ(v);
            }}
            placeholder="Buscar cliente, teléfono, zona..."
          />
        </div>
        <ClientesFilters
          segmento={segmento}
          estadoPago={estadoPago}
          tierRiesgo={tierRiesgo}
          conSaldo={conSaldo}
          scoreMin={scoreMin}
          zonaInput={zonaInput}
          cobradorInput={cobradorInput}
          onChange={handleFiltersChange}
          facets={facets}
        />
        <div className="flex items-center gap-1.5 ml-auto">
          <ClientesDensityToggle density={density} onChange={handleDensityChange} />
          <ClientesColumnSelector
            visibleColumns={visibleColumns}
            onChange={handleVisibleColumnsChange}
            pinnedColumns={pinnedColumns}
            onTogglePin={handleTogglePin}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 px-6 py-4">
        {error ? (
          <ClientesErrorState message={error.message} onRetry={refresh} />
        ) : isLoading ? (
          <ClientesLoadingSkeleton rows={10} />
        ) : items.length === 0 ? (
          <ClientesEmptyState
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <ClientesTable
            clientes={items}
            visibleColumns={visibleColumns}
            pinnedColumns={pinnedColumns}
            columnWidths={columnWidths}
            onColumnResize={handleColumnResize}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={handleRowClick}
            density={density}
            infiniteScroll={{ hasMore, isLoading: isLoadingMore, onLoadMore: loadMore }}
          />
        )}
      </div>
    </div>
  );
}
