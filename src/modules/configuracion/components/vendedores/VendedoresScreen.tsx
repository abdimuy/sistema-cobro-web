import { useState } from "react";
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
import { useVendedores } from "../../presentation/hooks/useVendedores";
import { useOpcionesVendedor } from "../../presentation/hooks/useOpcionesVendedor";
import {
  useAsignarVendedor,
  type AsignarVendedorSlots,
} from "../../presentation/hooks/useAsignarVendedor";
import { IdentidadCombobox } from "./IdentidadCombobox";
import type { IdentidadMicrosip, VendedorAsignacion } from "../../domain/entities";

const SKELETON_ROWS = 5;
const COL_COUNT = 4;

function slotsFromMapping(vendedor: VendedorAsignacion): AsignarVendedorSlots {
  return {
    l1: vendedor.mapping.v1?.listaId ?? null,
    l2: vendedor.mapping.v2?.listaId ?? null,
    l3: vendedor.mapping.v3?.listaId ?? null,
  };
}

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "sin asignar") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Sin asignar
      </Badge>
    );
  }
  if (estado === "3/3") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
      >
        ✓ 3/3
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
      ⚠ {estado}
    </Badge>
  );
}

function MappingSummary({ vendedor }: { vendedor: VendedorAsignacion }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
      <span>v1: {vendedor.mapping.v1 ? `${vendedor.mapping.v1.nombre} #${vendedor.mapping.v1.listaId}` : "—"}</span>
      <span>v2: {vendedor.mapping.v2 ? `${vendedor.mapping.v2.nombre} #${vendedor.mapping.v2.listaId}` : "—"}</span>
      <span>v3: {vendedor.mapping.v3 ? `${vendedor.mapping.v3.nombre} #${vendedor.mapping.v3.listaId}` : "—"}</span>
    </div>
  );
}

function VendedorRow({
  vendedor,
  opciones,
  onGuardar,
  onEliminar,
  saving,
}: {
  vendedor: VendedorAsignacion;
  opciones: ReadonlyArray<IdentidadMicrosip>;
  onGuardar: (usuarioId: string, slots: AsignarVendedorSlots) => void;
  onEliminar: (usuarioId: string) => void;
  saving: boolean;
}) {
  const [slots, setSlots] = useState<AsignarVendedorSlots>(() => slotsFromMapping(vendedor));
  const [identidad, setIdentidad] = useState<IdentidadMicrosip | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSelectIdentidad = (id: IdentidadMicrosip) => {
    setIdentidad(id);
    setSlots({ l1: id.v1ListaId, l2: id.v2ListaId, l3: id.v3ListaId });
  };

  // Reveal the per-slot manual override when the newly picked identity is
  // incomplete, or when the existing assignment on load was already partial
  // (so the admin can fix it without re-picking the whole identity).
  const showOverride =
    (identidad !== null && identidad.matchCount < 3) ||
    (identidad === null && vendedor.estado !== "sin asignar" && vendedor.estado !== "3/3");

  const comboValue = slots.l1 ?? slots.l2 ?? slots.l3 ?? null;

  return (
    <>
      <TableRow className="border-border/40 align-top">
        <TableCell className="px-3 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {vendedor.nombre || "Sin nombre"}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/70">
              {vendedor.email}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-3 py-3">
          <div className="flex flex-col gap-2 max-w-sm">
            <IdentidadCombobox opciones={opciones} value={comboValue} onSelect={handleSelectIdentidad} />
            <MappingSummary vendedor={vendedor} />
            {showOverride && (
              <div className="flex flex-col gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-600">
                  Completar slots faltantes
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <IdentidadCombobox
                    opciones={opciones}
                    slot="v1"
                    value={slots.l1 ?? null}
                    onSelect={(id) => setSlots((s) => ({ ...s, l1: id.v1ListaId }))}
                    placeholder="v1"
                  />
                  <IdentidadCombobox
                    opciones={opciones}
                    slot="v2"
                    value={slots.l2 ?? null}
                    onSelect={(id) => setSlots((s) => ({ ...s, l2: id.v2ListaId }))}
                    placeholder="v2"
                  />
                  <IdentidadCombobox
                    opciones={opciones}
                    slot="v3"
                    value={slots.l3 ?? null}
                    onSelect={(id) => setSlots((s) => ({ ...s, l3: id.v3ListaId }))}
                    placeholder="v3"
                  />
                </div>
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="px-3 py-3">
          <EstadoBadge estado={vendedor.estado} />
        </TableCell>
        <TableCell className="px-3 py-3">
          <div className="flex flex-col gap-1.5">
            <Button size="sm" disabled={saving} onClick={() => onGuardar(vendedor.usuarioId, slots)}>
              Guardar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              disabled={saving || vendedor.estado === "sin asignar"}
              onClick={() => setConfirmOpen(true)}
            >
              Quitar
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Quitar asignación de vendedor"
        description={`Se eliminará la asignación de vendedor Microsip de ${vendedor.nombre || vendedor.email}. Las nuevas ventas de crédito de este usuario quedarán sin vendedor Microsip hasta reasignar.`}
        confirmLabel="Quitar"
        destructive
        loading={saving}
        onConfirm={() => {
          setConfirmOpen(false);
          onEliminar(vendedor.usuarioId);
        }}
      />
    </>
  );
}

export function VendedoresScreen() {
  const { vendedores, isLoading, error, refresh } = useVendedores();
  const { opciones, isLoading: opcionesLoading, error: opcionesError } = useOpcionesVendedor();
  const { saving, asignar, eliminar } = useAsignarVendedor(refresh);

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
                  Usuario
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Vendedor Microsip
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Estado
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
            ) : vendedores.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COL_COUNT}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  Sin usuarios
                </TableCell>
              </TableRow>
            ) : (
              vendedores.map((v) => (
                <VendedorRow
                  key={v.usuarioId}
                  vendedor={v}
                  opciones={opciones}
                  onGuardar={(usuarioId, slots) => void asignar(usuarioId, slots)}
                  onEliminar={(usuarioId) => void eliminar(usuarioId)}
                  saving={saving}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && vendedores.length > 0 && (
        <span className="font-mono text-[11px] text-muted-foreground">
          {vendedores.length} usuario{vendedores.length !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
