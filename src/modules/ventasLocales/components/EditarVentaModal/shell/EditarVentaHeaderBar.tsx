import { Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VentaV2 } from "@/services/api/ventaV2Types";

const situacionLabel: Record<VentaV2["situacion"], string> = {
  borrador: "Borrador",
  revisada: "Revisada",
  aprobada: "Aprobada",
  cancelada: "Cancelada",
};

const dotColor = (venta: VentaV2): string => {
  if (venta.situacion === "cancelada") return "bg-destructive";
  if (venta.sincronizacion === "aplicada") return "bg-emerald-500";
  if (venta.situacion === "aprobada") return "bg-chart-2";
  if (venta.situacion === "revisada") return "bg-chart-4";
  return "bg-muted-foreground/60";
};

const folioDisplay = (venta: VentaV2): string =>
  venta.microsip_folio ?? `MSP-${venta.id.slice(0, 8).toUpperCase()}`;

interface Props {
  venta: VentaV2;
  onDiscard: () => void;
  onClose: () => void;
}

export const EditarVentaHeaderBar = ({ venta, onDiscard, onClose }: Props) => {
  const handleCopyFolio = () => {
    navigator.clipboard.writeText(folioDisplay(venta));
    toast.success("Folio copiado");
  };

  return (
    <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">Ventas</span>
        <span className="text-muted-foreground/40">/</span>
        <button
          type="button"
          onClick={handleCopyFolio}
          className="group inline-flex items-center gap-1.5 font-mono text-foreground tracking-wider"
          title="Copiar folio"
        >
          {folioDisplay(venta)}
          <Copy className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", dotColor(venta))} />
          {venta.sincronizacion === "aplicada"
            ? "Aplicada"
            : situacionLabel[venta.situacion]}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          className="h-7 text-xs text-muted-foreground"
        >
          Descartar
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
};
