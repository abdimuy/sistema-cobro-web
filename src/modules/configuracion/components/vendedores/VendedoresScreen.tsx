import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useVendedores } from "../../presentation/hooks/useVendedores";
import { useOpcionesVendedor } from "../../presentation/hooks/useOpcionesVendedor";
import { useAsignarVendedor, type AsignarVendedorSlots } from "../../presentation/hooks/useAsignarVendedor";
import { ConfigToolbar, type ConfigFiltro } from "../comunes/ConfigToolbar";
import { ConfigRowShell } from "../comunes/ConfigRowShell";
import { MapeoMeter } from "../comunes/MapeoMeter";
import { bucketFromFilled, type EstadoBucket } from "../comunes/lib/estadoBucket";
import { matchesSearch } from "../comunes/lib/normalizeText";
import { VendedorPanel } from "./VendedorPanel";
import { filledCount, nombreResuelto, slotsFromMapping } from "./lib/vendedorSlots";
import type { VendedorAsignacion } from "../../domain/entities";

const SKELETON_ROWS = 5;
const COL_COUNT = 4;

function VendedorRow({ vendedor, onOpen }: { vendedor: VendedorAsignacion; onOpen: () => void }) {
  const resuelto = nombreResuelto(vendedor);
  const filled = filledCount(slotsFromMapping(vendedor));

  return (
    <ConfigRowShell
      onOpen={onOpen}
      ariaLabel={`Editar mapeo de vendedor de ${vendedor.nombre || vendedor.email}`}
    >
      <TableCell className="px-3 py-0 align-middle">
        <div className="flex min-w-0 flex-col justify-center overflow-hidden">
          <span
            className="min-w-0 truncate text-sm font-medium text-foreground"
            title={vendedor.nombre || "Sin nombre"}
          >
            {vendedor.nombre || "Sin nombre"}
          </span>
          <span
            className="min-w-0 truncate font-mono text-[11px] text-muted-foreground/70"
            title={vendedor.email}
          >
            {vendedor.email}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-3 py-0 align-middle">
        <span
          className={`block max-w-full truncate text-sm ${resuelto ? "text-foreground" : "text-muted-foreground"}`}
          title={resuelto ?? undefined}
        >
          {resuelto ?? "Sin asignar"}
        </span>
      </TableCell>
      <TableCell className="px-3 py-0 align-middle">
        <MapeoMeter filled={filled} total={3} />
      </TableCell>
    </ConfigRowShell>
  );
}

export function VendedoresScreen() {
  const { vendedores, isLoading, error, refresh } = useVendedores();
  const { opciones, isLoading: opcionesLoading, error: opcionesError } = useOpcionesVendedor();
  const { saving, asignar, eliminar } = useAsignarVendedor(refresh);

  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<EstadoBucket>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loading = isLoading || opcionesLoading;
  const selected = selectedId ? (vendedores.find((v) => v.usuarioId === selectedId) ?? null) : null;

  const withBucket = useMemo(
    () =>
      vendedores.map((v) => ({
        vendedor: v,
        bucket: bucketFromFilled(filledCount(slotsFromMapping(v)), 3),
      })),
    [vendedores],
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
    { key: "todos", label: "Todos", count: counts.todos },
    { key: "sin-asignar", label: "Sin asignar", count: counts["sin-asignar"] },
    { key: "incompletos", label: "Incompletos", count: counts.incompletos },
    { key: "completos", label: "Completos", count: counts.completos },
  ];

  const filtered = useMemo(
    () =>
      withBucket
        .filter(({ bucket }) => filtro === "todos" || bucket === filtro)
        .filter(({ vendedor }) =>
          matchesSearch([vendedor.nombre, vendedor.email, nombreResuelto(vendedor)], search),
        )
        .map(({ vendedor }) => vendedor),
    [withBucket, filtro, search],
  );

  const handleGuardar = async (usuarioId: string, slots: AsignarVendedorSlots) => {
    const result = await asignar(usuarioId, slots);
    if (result) setSelectedId(null);
  };

  const handleEliminar = (usuarioId: string) => {
    void eliminar(usuarioId);
    setSelectedId(null);
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
          searchPlaceholder="Buscar usuario o vendedor…"
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="h-9 w-[34%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Usuario
                </span>
              </TableHead>
              <TableHead className="h-9 w-[46%] bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Vendedor Microsip
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
            ) : vendedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="h-24 text-center text-sm text-muted-foreground">
                  Sin usuarios
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="h-24 text-center text-sm text-muted-foreground">
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <VendedorRow key={v.usuarioId} vendedor={v} onOpen={() => setSelectedId(v.usuarioId)} />
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
            <VendedorPanel
              key={selected.usuarioId}
              vendedor={selected}
              opciones={opciones}
              saving={saving}
              onGuardar={(usuarioId, slots) => void handleGuardar(usuarioId, slots)}
              onEliminar={handleEliminar}
              onClose={() => setSelectedId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
