import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useDescargarReporte } from "../../presentation/hooks/useDescargarReporte";
import { formatMoney } from "../lib/format";
import type { VentaCliente } from "../../domain/entities/VentaCliente";

interface Props {
  open: boolean;
  onClose: () => void;
  clienteId: number;
  ventas: ReadonlyArray<VentaCliente>;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
}

// ReporteModal lets the user pick which ventas to include in the PDF report.
// All sales start selected — generating without changing anything produces the
// full report. When every loaded sale stays selected the request is sent with
// no filter (the server includes everything, even sales not loaded here); a
// trimmed selection sends explicit ids.
export function ReporteModal({
  open,
  onClose,
  clienteId,
  ventas,
  hasMore,
  loadMore,
  isLoadingMore,
}: Props) {
  const { descargar, isLoading, error } = useDescargarReporte(clienteId);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Re-select everything each time the modal opens (not on later ventas changes).
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setSelected(new Set(ventas.map((v) => v.doctoPvId)));
    }
    prevOpen.current = open;
  }, [open, ventas]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected =
    ventas.length > 0 && ventas.every((v) => selected.has(v.doctoPvId));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(ventas.map((v) => v.doctoPvId)));

  const handleGenerar = async () => {
    // All loaded selected → no filter (server returns every sale). Otherwise the
    // explicit subset of loaded sales.
    await descargar(allSelected ? undefined : Array.from(selected));
    if (!error) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <div className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="font-serif text-lg font-normal">
            Reporte PDF
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] text-muted-foreground">
            Elige las ventas a incluir · todas por defecto
          </DialogDescription>
        </div>

        {/* Select all */}
        <label className="flex cursor-pointer items-center gap-2 border-b border-border/40 px-6 py-2.5 hover:bg-muted/30">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            aria-label="Seleccionar todas las ventas"
          />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Todas ({ventas.length})
          </span>
        </label>

        {/* Venta list */}
        <div className="max-h-[50vh] overflow-y-auto">
          {ventas.map((v) => {
            const isLiquidada = Number(v.saldoVenta) === 0;
            return (
              <label
                key={v.doctoPvId}
                className="flex cursor-pointer items-center gap-3 border-b border-border/30 px-6 py-2.5 last:border-b-0 hover:bg-muted/30"
              >
                <Checkbox
                  checked={selected.has(v.doctoPvId)}
                  onCheckedChange={() => toggle(v.doctoPvId)}
                  aria-label={`Incluir venta ${v.folio}`}
                />
                <span className="w-24 shrink-0 font-mono text-xs tracking-wider text-foreground">
                  {v.folio}
                </span>
                <span className="w-20 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                  {dayjs(v.fecha).format("DD MMM YY")}
                </span>
                <span className="flex-1 text-right font-mono text-xs text-foreground tabular-nums">
                  {formatMoney(v.total)}
                </span>
                <span
                  className={cn(
                    "w-16 shrink-0 text-right font-mono text-[9px] uppercase tracking-wider",
                    isLiquidada ? "text-green-500" : "text-amber-500",
                  )}
                >
                  {isLiquidada ? "Liquidada" : "Debe"}
                </span>
              </label>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full px-6 py-2.5 text-center font-mono text-[11px] text-muted-foreground hover:bg-muted/30"
            >
              {isLoadingMore ? "Cargando…" : "Cargar más ventas"}
            </button>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 px-6 py-3">
          {error && (
            <span className="mr-auto self-center font-mono text-[11px] text-red-500">
              No se pudo generar
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="font-mono text-xs"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleGenerar}
            disabled={isLoading || selected.size === 0}
            className="font-mono text-xs"
          >
            {isLoading ? "Generando…" : `Generar PDF (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
