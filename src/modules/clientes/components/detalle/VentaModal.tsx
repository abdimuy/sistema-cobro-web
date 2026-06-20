import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useVentaDetalle } from "../../presentation/hooks/useVentaDetalle";
import { VentaModalHero } from "./VentaModalHero";
import { VentaProductosTable } from "./VentaProductosTable";
import { VentaContratoCard } from "./VentaContratoCard";
import { VentaPagosList } from "./VentaPagosList";
import { VentaRitmoPagos } from "./VentaRitmoPagos";
import { PlanPagos } from "./PlanPagos";

interface Props {
  clienteId: number;
  doctoPvId: number | null;
  open: boolean;
  onClose: () => void;
  onPagoClick?: (doctoCcId: number) => void;
}

export function VentaModal({ clienteId, doctoPvId, open, onClose, onPagoClick }: Props) {
  const { detalle, isLoading, error } = useVentaDetalle(clienteId, doctoPvId);

  if (!open || doctoPvId === null) {
    return null;
  }

  const tipoBadge = detalle
    ? detalle.venta.tipo === "CONTADO"
      ? "Contado"
      : "Crédito"
    : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          "[&_button.absolute.right-4.top-4]:hidden",
          "block max-w-[1000px] w-[94vw] max-h-[90vh] gap-0 overflow-hidden p-0",
          "border-border/80 bg-background shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2 data-[state=open]:duration-300",
        )}
      >
        <DialogTitle className="sr-only">Detalle de venta</DialogTitle>
        <DialogDescription className="sr-only">detalle de la venta</DialogDescription>

        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Ventas</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-mono text-foreground tracking-wider">
              {detalle ? detalle.venta.folio : "—"}
            </span>
            {tipoBadge && (
              <span className="ml-2 inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground">
                {tipoBadge}
              </span>
            )}
            {detalle && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(detalle.venta.fecha).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </header>

        {/* Scrollable body */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 60px)" }}>
          {isLoading && !detalle && (
            <div className="px-8 py-10 space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[120px] w-full" />
            </div>
          )}

          {error && !detalle && (
            <div className="flex h-64 flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="font-serif text-xl font-normal">
                No se pudo cargar la venta
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {error.message}
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}

          {detalle && (
            <div className="px-8 pb-16 space-y-8">
              <VentaModalHero detalle={detalle} />

              <hr className="border-border/60" />

              <section>
                <h3 className="mb-4 font-serif text-lg font-normal text-foreground">
                  Productos
                </h3>
                <VentaProductosTable productos={detalle.productos} />
              </section>

              {detalle.contrato !== null && (
                <>
                  <hr className="border-border/60" />
                  <VentaContratoCard contrato={detalle.contrato} />
                </>
              )}

              <hr className="border-border/60" />

              <VentaRitmoPagos
                venta={detalle.venta}
                pagos={detalle.pagos}
                contrato={detalle.contrato}
                onPagoClick={onPagoClick}
              />

              <hr className="border-border/60" />

              {detalle.contrato !== null && (
                <>
                  <PlanPagos detalle={detalle} />
                  <hr className="border-border/60" />
                </>
              )}

              <VentaPagosList pagos={detalle.pagos} onPagoClick={onPagoClick} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VentaModal;
