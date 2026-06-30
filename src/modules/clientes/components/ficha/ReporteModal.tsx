import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { Download, Loader2, Printer } from "lucide-react";
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
  nombreCliente: string;
  ventas: ReadonlyArray<VentaCliente>;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
}

// ReporteModal has two modes. In "selección" the user picks which ventas to
// include (all start selected — generating without changes produces the full
// report). On "Generar" it fetches the PDF and switches to "preview", embedding
// it in an iframe (Edge's PDF viewer on WebView2) with an action bar to print,
// save-as, or go back. Nothing is written to disk until the user chooses.
export function ReporteModal({
  open,
  onClose,
  clienteId,
  nombreCliente,
  ventas,
  hasMore,
  loadMore,
  isLoadingMore,
}: Props) {
  const {
    objectUrl,
    isLoading,
    isSaving,
    error,
    generar,
    reset,
    imprimir,
    guardarComo,
  } = useDescargarReporte(clienteId, nombreCliente);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isPreview = objectUrl !== null;

  // Re-select everything each time the modal opens (not on later ventas changes).
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setSelected(new Set(ventas.map((v) => v.doctoPvId)));
    }
    prevOpen.current = open;
  }, [open, ventas]);

  // Surface fetch failures once, leaving the selection in place to retry.
  useEffect(() => {
    if (error) toast.error("No se pudo generar");
  }, [error]);

  // Reset the spinner whenever a fresh preview URL arrives.
  useEffect(() => {
    setIframeLoaded(false);
  }, [objectUrl]);

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
    await generar(allSelected ? undefined : Array.from(selected));
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className={cn(
          "gap-0 p-0",
          isPreview ? "flex h-[85vh] max-w-3xl flex-col" : "max-w-md",
        )}
      >
        <div className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="font-serif text-lg font-normal">
            Reporte PDF
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] text-muted-foreground">
            {isPreview
              ? nombreCliente
              : "Elige las ventas a incluir · todas por defecto"}
          </DialogDescription>
        </div>

        {isPreview ? (
          <>
            <div className="relative flex-1 bg-muted/20">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={objectUrl ?? undefined}
                title="Reporte"
                className="h-full w-full"
                onLoad={() => setIframeLoaded(true)}
              />
            </div>

            <DialogFooter className="gap-2 border-t border-border/60 px-6 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="mr-auto font-mono text-xs"
              >
                Volver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => imprimir(iframeRef.current)}
                className="font-mono text-xs"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={guardarComo}
                disabled={isSaving}
                className="font-mono text-xs"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {isSaving ? "Guardando…" : "Guardar como"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
