import { useEffect, useState } from "react";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/modules/ventasLocales/components/detalle/ConfirmActionDialog";
import { IdentidadCombobox } from "./IdentidadCombobox";
import { MapeoMeter } from "../comunes/MapeoMeter";
import type { AsignarVendedorSlots } from "../../presentation/hooks/useAsignarVendedor";
import type { IdentidadMicrosip, VendedorAsignacion } from "../../domain/entities";
import {
  filledCount,
  listaIdFor,
  mappingKeyOf,
  nombreForSlot,
  slotsFromMapping,
  slotValue,
  withSlot,
  type Slot,
} from "./lib/vendedorSlots";

const SLOT_LABELS: Record<Slot, string> = {
  v1: "Vendedor 1",
  v2: "Vendedor 2",
  v3: "Vendedor 3",
};
const SLOTS: readonly Slot[] = ["v1", "v2", "v3"];

interface Props {
  vendedor: VendedorAsignacion;
  opciones: ReadonlyArray<IdentidadMicrosip>;
  saving: boolean;
  onGuardar: (usuarioId: string, slots: AsignarVendedorSlots) => void;
  onEliminar: (usuarioId: string) => void;
  onClose: () => void;
}

function slotsEqual(a: AsignarVendedorSlots, b: AsignarVendedorSlots): boolean {
  return (
    (a.l1 ?? null) === (b.l1 ?? null) &&
    (a.l2 ?? null) === (b.l2 ?? null) &&
    (a.l3 ?? null) === (b.l3 ?? null)
  );
}

// VendedorPanel is the ONLY editing surface for a vendedor row — seeded
// from the row when it opens, kept local until Guardar. Resyncs its local
// slots whenever the underlying vendedor's mapping genuinely changes
// (mappingKeyOf), which covers a refresh landing while this same row's
// panel stays mounted, without clobbering an in-progress pick on an
// unrelated refresh.
export function VendedorPanel({ vendedor, opciones, saving, onGuardar, onEliminar, onClose }: Props) {
  const savedSlots = slotsFromMapping(vendedor);
  const [slots, setSlots] = useState<AsignarVendedorSlots>(savedSlots);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const mappingKey = mappingKeyOf(vendedor);
  useEffect(() => {
    setSlots(slotsFromMapping(vendedor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappingKey]);

  const handleSelectIdentidad = (identidad: IdentidadMicrosip) => {
    setSlots({ l1: identidad.v1ListaId, l2: identidad.v2ListaId, l3: identidad.v3ListaId });
  };

  const filled = filledCount(slots);
  const estadoLabel = filled === 0 ? "Sin asignar" : `${filled}/3`;
  const isDirty = !slotsEqual(slots, savedSlots);
  const tieneMapeo = filledCount(savedSlots) > 0;
  const comboValue = slots.l1 ?? slots.l2 ?? slots.l3 ?? null;

  return (
    <div className="flex h-full flex-col gap-6">
      <SheetHeader>
        <SheetTitle className="font-serif text-xl font-normal text-foreground">
          {vendedor.nombre || "Sin nombre"}
        </SheetTitle>
        <SheetDescription className="font-mono text-[11px] text-muted-foreground">
          {vendedor.email}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Identidad Microsip
        </p>
        <IdentidadCombobox opciones={opciones} value={comboValue} onSelect={handleSelectIdentidad} />
      </div>

      <div className="flex flex-col gap-2.5">
        {SLOTS.map((slot) => {
          const listaId = slotValue(slots, slot);
          const nombre = nombreForSlot(vendedor, opciones, slot, listaId);
          return (
            <div
              key={slot}
              className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-card px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {SLOT_LABELS[slot]}
                </span>
                <span className="max-w-[60%] truncate text-right text-sm text-foreground" title={nombre ?? undefined}>
                  {nombre ?? <span className="text-muted-foreground">Sin asignar</span>}
                </span>
              </div>
              <IdentidadCombobox
                opciones={opciones}
                slot={slot}
                value={listaId}
                onSelect={(identidad) =>
                  setSlots((s) => withSlot(s, slot, listaIdFor(identidad, slot)))
                }
                placeholder={`Buscar ${SLOT_LABELS[slot].toLowerCase()}…`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
        <MapeoMeter filled={filled} total={3} />
        <span className="font-mono text-[11px] text-muted-foreground">{estadoLabel}</span>
      </div>

      <SheetFooter className="mt-auto flex-col gap-2 sm:flex-row sm:justify-between">
        {tieneMapeo ? (
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            disabled={saving}
            onClick={() => setConfirmOpen(true)}
          >
            Quitar
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving || !isDirty}
            onClick={() => onGuardar(vendedor.usuarioId, slots)}
          >
            Guardar
          </Button>
        </div>
      </SheetFooter>

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
    </div>
  );
}
