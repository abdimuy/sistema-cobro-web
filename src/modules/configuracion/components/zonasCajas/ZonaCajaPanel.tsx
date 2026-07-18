import { useEffect, useState } from "react";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/modules/ventasLocales/components/detalle/ConfirmActionDialog";
import { CatalogoCombobox } from "./CatalogoCombobox";
import { MapeoMeter } from "../comunes/MapeoMeter";
import type { AsignarZonaCajaInput } from "../../application/ports/ConfiguracionPort";
import type { OpcionesZonasCajas, ZonaCajaAsignacion } from "../../domain/entities";
import { filledCount, idsEqual, idsFromZona, refKeyOf, type ZonaIds } from "./lib/zonaRefs";

interface Props {
  zona: ZonaCajaAsignacion;
  opciones: OpcionesZonasCajas;
  saving: boolean;
  onGuardar: (input: AsignarZonaCajaInput) => void;
  onClose: () => void;
}

const TOTAL_SLOTS = 4;

// ZonaCajaPanel is the ONLY editing surface for a zona row — seeded from the
// row, kept local until Guardar. This config is live create-sale config, so
// Guardar is gated behind ConfirmActionDialog. Resyncs its local ids
// whenever the underlying zona's refs genuinely change (refKeyOf).
export function ZonaCajaPanel({ zona, opciones, saving, onGuardar, onClose }: Props) {
  const savedIds = idsFromZona(zona);
  const [ids, setIds] = useState<ZonaIds>(savedIds);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refKey = refKeyOf(zona);
  useEffect(() => {
    setIds(idsFromZona(zona));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refKey]);

  const filled = filledCount(zona);
  const isDirty = !idsEqual(ids, savedIds);

  return (
    <div className="flex h-full flex-col gap-6">
      <SheetHeader>
        <SheetTitle className="font-serif text-xl font-normal text-foreground">{zona.zonaNombre}</SheetTitle>
        <SheetDescription className="font-mono text-[11px] text-muted-foreground">
          Configuración de venta de la zona
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Caja</span>
          <CatalogoCombobox
            opciones={opciones.cajas}
            value={ids.cajaId}
            onSelect={(id) => setIds((s) => ({ ...s, cajaId: id }))}
            placeholder="Buscar caja…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Cajero</span>
          <CatalogoCombobox
            opciones={opciones.cajeros}
            value={ids.cajeroId}
            onSelect={(id) => setIds((s) => ({ ...s, cajeroId: id }))}
            placeholder="Buscar cajero…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Vendedor</span>
          <CatalogoCombobox
            opciones={opciones.vendedores}
            value={ids.vendedorId}
            onSelect={(id) => setIds((s) => ({ ...s, vendedorId: id }))}
            placeholder="Buscar vendedor…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Cobrador</span>
          <CatalogoCombobox
            opciones={opciones.cobradores}
            value={ids.cobradorId}
            onSelect={(id) => setIds((s) => ({ ...s, cobradorId: id }))}
            placeholder="Buscar cobrador…"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
        <MapeoMeter filled={filled} total={TOTAL_SLOTS} />
        <span className="font-mono text-[11px] text-muted-foreground">
          {filled === 0 ? "Sin asignar" : `${filled}/${TOTAL_SLOTS}`}
        </span>
      </div>

      <SheetFooter className="mt-auto flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" disabled={saving || !isDirty} onClick={() => setConfirmOpen(true)}>
          Guardar
        </Button>
      </SheetFooter>

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
    </div>
  );
}
