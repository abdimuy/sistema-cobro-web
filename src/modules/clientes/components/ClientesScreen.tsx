import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
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
import { setLastClientesUrl } from "../presentation/clientesViewCache";
import type { FilterState } from "./ClientesFilters";

// ClientesScreen is the orchestrator for the clientes directory module.
// It owns all filter, column, and sort state. Data fetching is delegated to
// hooks that read the port from context. Only ClientesContainer touches infra.
export function ClientesScreen() {
  // ── Filters live in the URL (single source of truth) ───────────────────────
  // Makes filters shareable, reload-safe, and restored automatically when the
  // user returns to the directory (browser back / the ficha "volver" link).
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const segmento = searchParams.get("segmento") ?? undefined;
  const estadoPago = searchParams.get("estadoPago") ?? undefined;
  const tierRiesgo = searchParams.get("tier") ?? undefined;
  const bandaCredito = searchParams.get("bandaCredito") ?? undefined;
  const bandaRecompra = searchParams.get("bandaRecompra") ?? undefined;
  const bandaClv = searchParams.get("bandaClv") ?? undefined;
  const conSaldo = searchParams.get("conSaldo") === "1" ? true : undefined;
  const scoreMin = searchParams.has("scoreMin")
    ? Number(searchParams.get("scoreMin"))
    : undefined;
  const zonaInput = searchParams.get("zona") ?? undefined;
  const cobradorInput = searchParams.get("cobrador") ?? undefined;

  // searchInput is the local draft for the text box; q (the committed query) is
  // only updated on submit. Initialised from the URL so a back-navigation shows
  // the active term.
  const [searchInput, setSearchInput] = useState(q);

  // cacheKey = the canonical filter signature, used by the data + scroll cache.
  const cacheKey = searchParams.toString();

  // Remember the current directory URL so the ficha "volver" link can return here
  // with filters and scroll intact.
  const location = useLocation();
  useEffect(() => {
    setLastClientesUrl(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // updateParams writes a partial change to the URL query. replace: true keeps
  // filter tweaks out of the history stack, so "back" from a ficha returns to the
  // list in one step rather than undoing each filter change.
  const updateParams = useCallback(
    (changes: Record<string, string | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === "") next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // ── Column / density state (load from localStorage) ───────────────────────
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(loadVisibleColumns);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(loadColumnWidths);
  const [density, setDensity] = useState<Density>(loadDensity);
  const [pinnedColumns, setPinnedColumns] = useState<ColumnId[]>(loadPinnedColumns);

  // ── Sort (server-side) lives in the URL too ────────────────────────────────
  // sortKey holds the API sort_by enum value (columns.ts sortKeys map 1:1 to it).
  const sortKey = searchParams.get("sort");
  const sortOrder: "asc" | "desc" =
    searchParams.get("order") === "desc" ? "desc" : "asc";

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        updateParams({ order: sortOrder === "asc" ? "desc" : "asc" });
      } else {
        updateParams({ sort: key, order: "asc" });
      }
    },
    [sortKey, sortOrder, updateParams],
  );

  // ── Data hook ─────────────────────────────────────────────────────────────
  // zona/cobrador are Phase 1 free-text inputs; parse to number for the backend.
  const { items, facets, isLoading, isLoadingMore, isRevalidating, error, hasMore, loadMore, refresh } =
    useBuscarClientes({
      q: q || undefined,
      segmento: segmento as SegmentoValue | undefined,
      estadoPago: estadoPago as EstadoPagoValue | undefined,
      tier: tierRiesgo,
      bandaCredito,
      bandaRecompra,
      bandaClv,
      conSaldo,
      scoreMin,
      zona: zonaInput ? parseInt(zonaInput, 10) || undefined : undefined,
      cobrador: cobradorInput ? parseInt(cobradorInput, 10) || undefined : undefined,
      // Sort is server-side: the API sorts the whole matching set and returns the
      // already-sorted page. items below are rendered in the order received.
      sortBy: sortKey ?? undefined,
      sortOrder,
    }, cacheKey);

  // ── Derived state ─────────────────────────────────────────────────────────
  const hasFilters = !!(
    q ||
    segmento ||
    estadoPago ||
    tierRiesgo ||
    bandaCredito ||
    bandaRecompra ||
    bandaClv ||
    conSaldo ||
    scoreMin !== undefined ||
    zonaInput ||
    cobradorInput
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    // Clears every filter param but keeps the active sort.
    updateParams({
      q: undefined,
      segmento: undefined,
      estadoPago: undefined,
      tier: undefined,
      bandaCredito: undefined,
      bandaRecompra: undefined,
      bandaClv: undefined,
      conSaldo: undefined,
      scoreMin: undefined,
      zona: undefined,
      cobrador: undefined,
    });
  }, [updateParams]);

  // ── Filter change dispatcher ───────────────────────────────────────────────
  const handleFiltersChange = useCallback(
    (changes: Partial<FilterState>) => {
      const p: Record<string, string | undefined> = {};
      if ("segmento" in changes) p.segmento = changes.segmento;
      if ("estadoPago" in changes) p.estadoPago = changes.estadoPago;
      if ("tierRiesgo" in changes) p.tier = changes.tierRiesgo;
      if ("bandaCredito" in changes) p.bandaCredito = changes.bandaCredito;
      if ("bandaRecompra" in changes) p.bandaRecompra = changes.bandaRecompra;
      if ("bandaClv" in changes) p.bandaClv = changes.bandaClv;
      if ("conSaldo" in changes) p.conSaldo = changes.conSaldo ? "1" : undefined;
      if ("scoreMin" in changes)
        p.scoreMin =
          changes.scoreMin !== undefined ? String(changes.scoreMin) : undefined;
      if ("zonaInput" in changes) p.zona = changes.zonaInput;
      if ("cobradorInput" in changes) p.cobrador = changes.cobradorInput;
      updateParams(p);
    },
    [updateParams],
  );

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
          <div className="mt-1 flex items-center gap-3">
            {/* Subtle background-refresh indicator (stale-while-revalidate) */}
            {isRevalidating && (
              <span
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70"
                data-testid="revalidando-indicator"
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                Actualizando
              </span>
            )}
            {/* Reindexar — subtle admin action */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleRefrescar()}
              disabled={isRefreshing}
              className="text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs"
              data-testid="reindexar-button"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
              />
              <span className="hidden sm:inline">Reindexar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 flex flex-wrap items-center gap-2 border-b border-border/40">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <ClientesSearchBar
            value={searchInput}
            onSearch={(v) => {
              setSearchInput(v);
              updateParams({ q: v || undefined });
            }}
            placeholder="Buscar cliente, teléfono, zona..."
          />
        </div>
        <ClientesFilters
          segmento={segmento}
          estadoPago={estadoPago}
          tierRiesgo={tierRiesgo}
          bandaCredito={bandaCredito}
          bandaRecompra={bandaRecompra}
          bandaClv={bandaClv}
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
      <div className="flex-1 min-h-0 flex flex-col px-6 py-4">
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
            cacheKey={cacheKey}
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
