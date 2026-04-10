import React, { useMemo } from "react";
import {
  Search,
  X,
  Filter,
  Activity,
  MapPin,
  CalendarDays,
  ArrowUpDown,
  ClipboardList,
} from "lucide-react";
import { Garantia } from "../../modules/garantias/Garantias";
import { EstadoGarantia } from "../../services/api/getEstadosGarantia";
import { ZonaCliente } from "../../services/api/getZonasCliente";

export type SortField = "fecha" | "id" | "estado";
export type SortOrder = "asc" | "desc";

interface GarantiasSearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterEstado: string;
  onFilterEstadoChange: (value: string) => void;
  filterZona: string;
  onFilterZonaChange: (value: string) => void;
  filterFechaInicio: string;
  onFilterFechaInicioChange: (value: string) => void;
  filterFechaFin: string;
  onFilterFechaFinChange: (value: string) => void;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
  estados: EstadoGarantia[];
  zonas: ZonaCliente[];
  garantias: Garantia[];
  filteredCount: number;
}

const GarantiasSearchAndFilters: React.FC<GarantiasSearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterEstado,
  onFilterEstadoChange,
  filterZona,
  onFilterZonaChange,
  filterFechaInicio,
  onFilterFechaInicioChange,
  filterFechaFin,
  onFilterFechaFinChange,
  sortBy,
  sortOrder,
  onSortChange,
  estados,
  zonas,
  garantias,
  filteredCount,
}) => {
  const stats = useMemo(() => {
    const byEstado: Record<string, number> = {};
    garantias.forEach((g) => {
      byEstado[g.ESTADO] = (byEstado[g.ESTADO] || 0) + 1;
    });
    return { total: garantias.length, byEstado };
  }, [garantias]);

  const hasActiveFilters =
    searchTerm !== "" ||
    filterEstado !== "all" ||
    filterZona !== "all" ||
    filterFechaInicio !== "" ||
    filterFechaFin !== "";

  const activeFilters: { label: string; onClear: () => void }[] = [];
  if (searchTerm)
    activeFilters.push({
      label: `"${searchTerm}"`,
      onClear: () => onSearchChange(""),
    });
  if (filterEstado !== "all") {
    const est = estados.find((e) => e.value === filterEstado);
    activeFilters.push({
      label: `Estado: ${est?.label || filterEstado.replace(/_/g, " ")}`,
      onClear: () => onFilterEstadoChange("all"),
    });
  }
  if (filterZona !== "all") {
    const zona = zonas.find(
      (z) => z.ZONA_CLIENTE_ID.toString() === filterZona
    );
    activeFilters.push({
      label: `Zona: ${zona?.ZONA_CLIENTE || filterZona}`,
      onClear: () => onFilterZonaChange("all"),
    });
  }
  if (filterFechaInicio)
    activeFilters.push({
      label: `Desde: ${filterFechaInicio}`,
      onClear: () => onFilterFechaInicioChange(""),
    });
  if (filterFechaFin)
    activeFilters.push({
      label: `Hasta: ${filterFechaFin}`,
      onClear: () => onFilterFechaFinChange(""),
    });

  const clearAll = () => {
    onSearchChange("");
    onFilterEstadoChange("all");
    onFilterZonaChange("all");
    onFilterFechaInicioChange("");
    onFilterFechaFinChange("");
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Search */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-t border-border bg-muted/30 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

        <FilterSelect
          value={filterEstado}
          onChange={onFilterEstadoChange}
          active={filterEstado !== "all"}
          icon={<Activity className="w-3.5 h-3.5" />}
        >
          <option value="all">Estado</option>
          {estados.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filterZona}
          onChange={onFilterZonaChange}
          active={filterZona !== "all"}
          icon={<MapPin className="w-3.5 h-3.5" />}
        >
          <option value="all">Zona</option>
          {zonas.map((z) => (
            <option key={z.ZONA_CLIENTE_ID} value={z.ZONA_CLIENTE_ID.toString()}>
              {z.ZONA_CLIENTE}
            </option>
          ))}
        </FilterSelect>

        <FilterDateInput
          value={filterFechaInicio}
          onChange={onFilterFechaInicioChange}
          active={filterFechaInicio !== ""}
          icon={<CalendarDays className="w-3.5 h-3.5" />}
          placeholder="Desde"
        />

        <FilterDateInput
          value={filterFechaFin}
          onChange={onFilterFechaFinChange}
          active={filterFechaFin !== ""}
          icon={<CalendarDays className="w-3.5 h-3.5" />}
          placeholder="Hasta"
        />

        <div className="w-px h-5 bg-border shrink-0 mx-1" />

        <FilterSelect
          value={`${sortBy}-${sortOrder}`}
          onChange={(v) => {
            const [newSortBy, newSortOrder] = v.split("-");
            onSortChange(newSortBy as SortField, newSortOrder as SortOrder);
          }}
          active={false}
          icon={<ArrowUpDown className="w-3.5 h-3.5" />}
        >
          <option value="fecha-desc">Mas reciente</option>
          <option value="fecha-asc">Mas antiguo</option>
          <option value="id-desc">ID ↓</option>
          <option value="id-asc">ID ↑</option>
          <option value="estado-asc">Estado A-Z</option>
          <option value="estado-desc">Estado Z-A</option>
        </FilterSelect>
      </div>

      {/* Active filters + stats */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border">
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.length > 0 ? (
            <>
              {activeFilters.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={f.onClear}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {f.label}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              {activeFilters.length > 1 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-1"
                >
                  Limpiar todo
                </button>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Sin filtros activos
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
          {Object.entries(stats.byEstado).length > 0 && (
            <span className="hidden md:inline-flex items-center gap-1.5">
              {Object.entries(stats.byEstado)
                .slice(0, 3)
                .map(([estado, count]) => (
                  <span key={estado} className="text-xs">
                    {estado.replace(/_/g, " ")}: {count}
                  </span>
                ))
                .reduce<React.ReactNode[]>((acc, el, i) => {
                  if (i > 0) acc.push(<span key={`sep-${i}`} className="text-border">|</span>);
                  acc.push(el);
                  return acc;
                }, [])}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4" />
            {hasActiveFilters
              ? `${filteredCount} de ${stats.total}`
              : stats.total}{" "}
            garantia{stats.total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Filter pill select ──

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  active: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  active,
  icon,
  children,
}) => (
  <div
    className={`inline-flex items-center gap-1.5 rounded-lg border cursor-pointer transition-all ${
      active
        ? "bg-primary/10 border-primary/30 text-primary"
        : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
    }`}
  >
    {icon && <span className="pl-2.5 flex items-center">{icon}</span>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none bg-transparent text-sm font-medium cursor-pointer outline-none py-1 ${
        icon ? "pl-0 pr-2.5" : "px-2.5"
      }`}
    >
      {children}
    </select>
  </div>
);

// ── Filter date input ──

interface FilterDateInputProps {
  value: string;
  onChange: (value: string) => void;
  active: boolean;
  icon?: React.ReactNode;
  placeholder: string;
}

const FilterDateInput: React.FC<FilterDateInputProps> = ({
  value,
  onChange,
  active,
  icon,
  placeholder,
}) => (
  <div
    className={`inline-flex items-center gap-1.5 rounded-lg border cursor-pointer transition-all ${
      active
        ? "bg-primary/10 border-primary/30 text-primary"
        : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
    }`}
  >
    {icon && <span className="pl-2.5 flex items-center">{icon}</span>}
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-transparent text-sm font-medium cursor-pointer outline-none py-1 ${
        icon ? "pl-0 pr-2.5" : "px-2.5"
      } ${!value ? "text-muted-foreground" : ""}`}
    />
  </div>
);

export default GarantiasSearchAndFilters;
