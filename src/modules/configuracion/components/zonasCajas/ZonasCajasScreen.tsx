import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/modules/ventasLocales/components/detalle/ConfirmActionDialog";
import { useZonasCajas } from "../../presentation/hooks/useZonasCajas";
import { useOpcionesZonasCajas } from "../../presentation/hooks/useOpcionesZonasCajas";
import { useAsignarZonaCaja } from "../../presentation/hooks/useAsignarZonaCaja";
import type { AsignarZonaCajaInput } from "../../application/ports/ConfiguracionPort";
import { CatalogoCombobox } from "./CatalogoCombobox";
import {
  SIN_ASIGNAR_ID,
  type OpcionesZonasCajas,
  type ZonaCajaAsignacion,
} from "../../domain/entities";

const SKELETON_ROWS = 5;
const COL_COUNT = 6;

type RowIds = {
  cajaId: number;
  cajeroId: number;
  vendedorId: number;
  cobradorId: number;
};

function idsFromZona(zona: ZonaCajaAsignacion): RowIds {
  return {
    cajaId: zona.caja?.id ?? SIN_ASIGNAR_ID,
    cajeroId: zona.cajero?.id ?? SIN_ASIGNAR_ID,
    vendedorId: zona.vendedor?.id ?? SIN_ASIGNAR_ID,
    cobradorId: zona.cobrador?.id ?? SIN_ASIGNAR_ID,
  };
}

// Derived-value key for the fields that actually determine a row's local
// edit state. Rows are keyed by the stable zonaClienteId, so React reuses
// the same ZonaCajaRow instance across list refreshes — comparing THIS key
// (not the `zona` object identity) lets the row resync only when its own
// refs genuinely changed, without wiping an admin's in-progress selection
// on an unrelated refresh that happens to produce a new (but value-equal)
// zona object.
function refKeyOf(zona: ZonaCajaAsignacion): string {
  return [
    zona.caja?.id ?? "-",
    zona.cajero?.id ?? "-",
    zona.vendedor?.id ?? "-",
    zona.cobrador?.id ?? "-",
  ].join("|");
}

function isSinAsignar(zona: ZonaCajaAsignacion): boolean {
  return !zona.caja && !zona.cajero && !zona.vendedor && !zona.cobrador;
}

function ZonaCajaRow({
  zona,
  opciones,
  onGuardar,
  saving,
}: {
  zona: ZonaCajaAsignacion;
  opciones: OpcionesZonasCajas;
  onGuardar: (input: AsignarZonaCajaInput) => void;
  saving: boolean;
}) {
  const [ids, setIds] = useState<RowIds>(() => idsFromZona(zona));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refKey = refKeyOf(zona);

  // Resync local edit state whenever THIS row's refs actually changed —
  // e.g. after a successful Guardar (refresh()) or an external change.
  // Keyed on refKey (derived values), not `zona` itself, so an unrelated
  // refresh that leaves this row's values unchanged does not clobber an
  // in-progress pick. This prevents Guardar from silently re-submitting
  // stale ids for a row whose config changed elsewhere.
  useEffect(() => {
    setIds(idsFromZona(zona));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refKey]);

  return (
    <>
      <TableRow className="border-border/40 align-top">
        <TableCell className="px-3 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">{zona.zonaNombre}</span>
            {isSinAsignar(zona) && (
              <Badge variant="outline" className="w-fit text-muted-foreground">
                Sin asignar
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="px-3 py-3">
          <CatalogoCombobox
            opciones={opciones.cajas}
            value={ids.cajaId}
            onSelect={(id) => setIds((s) => ({ ...s, cajaId: id }))}
            placeholder="Buscar caja…"
          />
        </TableCell>
        <TableCell className="px-3 py-3">
          <CatalogoCombobox
            opciones={opciones.cajeros}
            value={ids.cajeroId}
            onSelect={(id) => setIds((s) => ({ ...s, cajeroId: id }))}
            placeholder="Buscar cajero…"
          />
        </TableCell>
        <TableCell className="px-3 py-3">
          <CatalogoCombobox
            opciones={opciones.vendedores}
            value={ids.vendedorId}
            onSelect={(id) => setIds((s) => ({ ...s, vendedorId: id }))}
            placeholder="Buscar vendedor…"
          />
        </TableCell>
        <TableCell className="px-3 py-3">
          <CatalogoCombobox
            opciones={opciones.cobradores}
            value={ids.cobradorId}
            onSelect={(id) => setIds((s) => ({ ...s, cobradorId: id }))}
            placeholder="Buscar cobrador…"
          />
        </TableCell>
        <TableCell className="px-3 py-3">
          <Button size="sm" disabled={saving} onClick={() => setConfirmOpen(true)}>
            Guardar
          </Button>
        </TableCell>
      </TableRow>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Guardar configuración de zona"
        description={`Esto afecta la creación de ventas de esta zona: ${zona.zonaNombre}.`}
        confirmLabel="Guardar"
        loading={saving}
        onConfirm={() => {
          setConfirmOpen(false);
          onGuardar({
            zonaClienteId: zona.zonaClienteId,
            cajaId: ids.cajaId,
            cajeroId: ids.cajeroId,
            vendedorId: ids.vendedorId,
            cobradorId: ids.cobradorId,
          });
        }}
      />
    </>
  );
}

export function ZonasCajasScreen() {
  const { zonasCajas, isLoading, error, refresh } = useZonasCajas();
  const { opciones, isLoading: opcionesLoading, error: opcionesError } = useOpcionesZonasCajas();
  const { saving, asignar } = useAsignarZonaCaja(refresh);

  const loading = isLoading || opcionesLoading;

  return (
    <div className="space-y-4 py-4">
      {(error || opcionesError) && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          Error al cargar
        </p>
      )}

      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Zona
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Caja
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Cajero
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Vendedor
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Cobrador
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Acción
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: COL_COUNT }).map((_, ci) => (
                    <TableCell key={ci} className="px-3 py-3">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : zonasCajas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COL_COUNT}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  Sin zonas
                </TableCell>
              </TableRow>
            ) : (
              zonasCajas.map((z) => (
                <ZonaCajaRow
                  key={z.zonaClienteId}
                  zona={z}
                  opciones={opciones}
                  onGuardar={(input) => void asignar(input)}
                  saving={saving}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && zonasCajas.length > 0 && (
        <span className="font-mono text-[11px] text-muted-foreground">
          {zonasCajas.length} zona{zonasCajas.length !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
