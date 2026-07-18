import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useZonasCajas } from "../../presentation/hooks/useZonasCajas";
import { useOpcionesZonasCajas } from "../../presentation/hooks/useOpcionesZonasCajas";
import { useAsignarZonaCaja } from "../../presentation/hooks/useAsignarZonaCaja";
import type { AsignarZonaCajaInput } from "../../application/ports/ConfiguracionPort";
import { ConfigToolbar, type ConfigFiltro } from "../comunes/ConfigToolbar";
import { ConfigRowShell } from "../comunes/ConfigRowShell";
import { MapeoMeter } from "../comunes/MapeoMeter";
import { bucketFromFilled, type EstadoBucket } from "../comunes/lib/estadoBucket";
import { matchesSearch } from "../comunes/lib/normalizeText";
import { ZonaCajaPanel } from "./ZonaCajaPanel";
import { filledCount, resumenAsignacion } from "./lib/zonaRefs";
import type { ZonaCajaAsignacion } from "../../domain/entities";

const SKELETON_ROWS = 5;
const COL_COUNT = 4;
const TOTAL_SLOTS = 4;

function ZonaCajaRow({ zona, onOpen }: { zona: ZonaCajaAsignacion; onOpen: () => void }) {
  const resumen = resumenAsignacion(zona);
  const filled = filledCount(zona);
  const sinAsignar = filled === 0;

  return (
    <ConfigRowShell onOpen={onOpen} ariaLabel={`Editar configuración de zona ${zona.zonaNombre}`}>
      <TableCell className="px-3 py-0 align-middle">
        <span
          className="block max-w-full truncate text-sm font-medium text-foreground"
          title={zona.zonaNombre}
        >
          {zona.zonaNombre}
        </span>
      </TableCell>
      <TableCell className="px-3 py-0 align-middle">
        <span
          className={`block max-w-full truncate text-sm ${sinAsignar ? "text-muted-foreground" : "text-foreground"}`}
          title={resumen}
        >
          {resumen}
        </span>
      </TableCell>
      <TableCell className="px-3 py-0 align-middle">
        <MapeoMeter filled={filled} total={TOTAL_SLOTS} />
      </TableCell>
    </ConfigRowShell>
  );
}

export function ZonasCajasScreen() {
  const { zonasCajas, isLoading, error, refresh } = useZonasCajas();
  const { opciones, isLoading: opcionesLoading, error: opcionesError } = useOpcionesZonasCajas();
  const { saving, asignar } = useAsignarZonaCaja(refresh);

  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<EstadoBucket>("todos");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loading = isLoading || opcionesLoading;
  const selected = selectedId !== null ? (zonasCajas.find((z) => z.zonaClienteId === selectedId) ?? null) : null;

  const withBucket = useMemo(
    () => zonasCajas.map((z) => ({ zona: z, bucket: bucketFromFilled(filledCount(z), TOTAL_SLOTS) })),
    [zonasCajas],
  );

  const counts = useMemo(
    () => ({
      todos: withBucket.length,
      "sin-asignar": withBucket.filter((x) => x.bucket === "sin-asignar").length,
      incompletos: withBucket.filter((x) => x.bucket === "incompletos").length,
      completos: withBucket.filter((x) => x.bucket === "completos").length,
    }),
    [withBucket],
  );

  const filtros: ConfigFiltro[] = [
    { key: "todos", label: "Todas", count: counts.todos },
    { key: "sin-asignar", label: "Sin asignar", count: counts["sin-asignar"] },
    { key: "incompletos", label: "Incompletas", count: counts.incompletos },
    { key: "completos", label: "Completas", count: counts.completos },
  ];

  const filtered = useMemo(
    () =>
      withBucket
        .filter(({ bucket }) => filtro === "todos" || bucket === filtro)
        .filter(({ zona }) =>
          matchesSearch(
            [zona.zonaNombre, zona.caja?.nombre, zona.cajero?.nombre, zona.vendedor?.nombre, zona.cobrador?.nombre],
            search,
          ),
        )
        .map(({ zona }) => zona),
    [withBucket, filtro, search],
  );

  const handleGuardar = async (input: AsignarZonaCajaInput) => {
    const result = await asignar(input);
    if (result) setSelectedId(null);
  };

  return (
    <div className="space-y-4 py-4">
      {(error || opcionesError) && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          Error al cargar
        </p>
      )}

      {!loading && (
        <ConfigToolbar
          search={search}
          onSearch={setSearch}
          filtros={filtros}
          filtroActivo={filtro}
          onFiltro={setFiltro}
          total={filtered.length}
          searchPlaceholder="Buscar zona, caja, cajero, vendedor o cobrador…"
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="h-9 w-[22%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Zona
                </span>
              </TableHead>
              <TableHead className="h-9 w-[58%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Asignación
                </span>
              </TableHead>
              <TableHead className="h-9 w-28 bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Mapeo
                </span>
              </TableHead>
              <TableHead className="h-9 w-12 bg-muted/30 px-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="h-14 border-border/40">
                  {Array.from({ length: COL_COUNT }).map((_, ci) => (
                    <TableCell key={ci} className="px-3 py-3">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : zonasCajas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="h-24 text-center text-sm text-muted-foreground">
                  Sin zonas
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="h-24 text-center text-sm text-muted-foreground">
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((z) => (
                <ZonaCajaRow key={z.zonaClienteId} zona={z} onOpen={() => setSelectedId(z.zonaClienteId)} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          {selected && (
            <ZonaCajaPanel
              key={selected.zonaClienteId}
              zona={selected}
              opciones={opciones}
              saving={saving}
              onGuardar={(input) => void handleGuardar(input)}
              onClose={() => setSelectedId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
