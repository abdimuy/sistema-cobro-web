import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Skeleton } from "../../components/ui/skeleton";
import useGetGarantiasActivas from "../../hooks/useGetGarantiasActivas";
import useGetEstadosGarantia from "../../hooks/useGetEstadosGarantia";
import useGetZonasCliente from "../../hooks/useGetZonasCliente";
import GarantiasSearchAndFilters, {
  SortField,
  SortOrder,
} from "../../components/garantias/GarantiasSearchAndFilters";
import GarantiaCard from "../../components/garantias/GarantiaCard";
import { GarantiaFilters } from "../../services/api/getGarantiasActivas";
import { ClipboardList } from "lucide-react";

// Interfaz de datos de garantía
export type Garantia = {
  ID: number;
  DOCTO_CC_ID: number;
  FECHA_SOLICITUD: string;
  DESCRIPCION_FALLA: string;
  ESTADO: string;
  OBSERVACIONES?: string;
  EXTERNAL_ID: string | null;
  NOMBRE_CLIENTE: string | null;
  NOMBRE_PRODUCTO: string | null;
  ZONA_CLIENTE_ID: number | null;
  ZONA_CLIENTE_NOMBRE: string | null;
};

const GarantiasListPage: React.FC = () => {
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [filterZona, setFilterZona] = useState("all");
  const [filterFechaInicio, setFilterFechaInicio] = useState("");
  const [filterFechaFin, setFilterFechaFin] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("fecha");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Debounced client search
  const [debouncedCliente, setDebouncedCliente] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedCliente(searchTerm);
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm]);

  // Build server-side filters
  const serverFilters = useMemo<GarantiaFilters>(
    () => ({
      estado: filterEstado !== "all" ? filterEstado : undefined,
      fechaInicio: filterFechaInicio || undefined,
      fechaFin: filterFechaFin || undefined,
      zonaClienteId: filterZona !== "all" ? filterZona : undefined,
      cliente: debouncedCliente || undefined,
    }),
    [filterEstado, filterFechaInicio, filterFechaFin, filterZona, debouncedCliente]
  );

  const { garantias, loading, error } = useGetGarantiasActivas(serverFilters);
  const { estados, getEstadoLabel } = useGetEstadosGarantia();
  const { zonas } = useGetZonasCliente();

  // Client-side sort
  const sortedGarantias = useMemo(() => {
    const sorted = [...garantias];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "fecha") {
        cmp =
          new Date(a.FECHA_SOLICITUD).getTime() -
          new Date(b.FECHA_SOLICITUD).getTime();
      } else if (sortBy === "id") {
        cmp = a.ID - b.ID;
      } else if (sortBy === "estado") {
        cmp = a.ESTADO.localeCompare(b.ESTADO);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [garantias, sortBy, sortOrder]);

  const handleSortChange = useCallback(
    (newSortBy: SortField, newSortOrder: SortOrder) => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    []
  );

  return (
    <div className="p-6 bg-muted/50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        Garantias
      </h1>

      <GarantiasSearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterEstado={filterEstado}
        onFilterEstadoChange={setFilterEstado}
        filterZona={filterZona}
        onFilterZonaChange={setFilterZona}
        filterFechaInicio={filterFechaInicio}
        onFilterFechaInicioChange={setFilterFechaInicio}
        filterFechaFin={filterFechaFin}
        onFilterFechaFinChange={setFilterFechaFin}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        estados={estados}
        zonas={zonas}
        garantias={garantias}
        filteredCount={sortedGarantias.length}
      />

      <div className="flex flex-col gap-3 mt-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        ) : sortedGarantias.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              No se encontraron garantias
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Intenta ajustar los filtros de busqueda
            </p>
          </div>
        ) : (
          sortedGarantias.map((g) => (
            <GarantiaCard
              key={g.ID}
              garantia={g}
              getEstadoLabel={getEstadoLabel}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GarantiasListPage;
