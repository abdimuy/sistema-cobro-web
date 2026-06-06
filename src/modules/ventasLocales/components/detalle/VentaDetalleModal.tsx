import { useCallback, useState } from "react";
import dayjs from "dayjs";
import { Copy, Pencil, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import useVentaV2 from "@/hooks/useVentaV2";
import EditarVentaSheet from "../EditarVentaSheet";
import EditarVentaModal, { isNuevoEditor } from "../EditarVentaModal";
import { VentaV2 } from "@/services/api/ventaV2Types";

import VentaDetalleHero from "./VentaDetalleHero";
import VentaWorkflowTimeline from "./VentaWorkflowTimeline";
import VentaActionBar from "./VentaActionBar";
import VentaProductosTable from "./VentaProductosTable";
import VentaPlanCreditoCard from "./VentaPlanCreditoCard";
import VentaVendedoresList from "./VentaVendedoresList";
import VentaUbicacionTab from "./VentaUbicacionTab";
import VentaImagenesGrid from "./VentaImagenesGrid";
import VentaAuditoriaTab from "./VentaAuditoriaTab";
import VentaCanceladaBanner from "./VentaCanceladaBanner";
import VentaDetalleSkeleton from "./VentaDetalleSkeleton";

interface Props {
  ventaId: string;
  onClose: () => void;
}

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

export const VentaDetalleModal = ({ ventaId, onClose }: Props) => {
  const { venta, loading, error, refetch } = useVentaV2(ventaId);
  const [activeTab, setActiveTab] = useState("resumen");
  const [editOpen, setEditOpen] = useState(false);

  const handleCopyFolio = useCallback(() => {
    if (!venta) return;
    navigator.clipboard.writeText(folioDisplay(venta));
    toast.success("Folio copiado");
  }, [venta]);

  const handleUpdated = useCallback(
    async (_next: VentaV2) => {
      await refetch();
    },
    [refetch]
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          "[&_button.absolute.right-4.top-4]:hidden",
          "block max-w-[1180px] w-[96vw] h-[92vh] gap-0 overflow-hidden p-0",
          "border-border/80 bg-background shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2 data-[state=open]:duration-300"
        )}
      >
        <DialogTitle className="sr-only">Detalle de venta</DialogTitle>

        {loading || !venta ? (
          error ? (
            <ErrorView message={error} onClose={onClose} />
          ) : (
            <VentaDetalleSkeleton />
          )
        ) : (
          <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">Ventas</span>
                <span className="text-muted-foreground/40">/</span>
                <button
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
                {venta.situacion === "borrador" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                    className="h-7 gap-1.5 text-xs text-muted-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                )}
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

            <div className="flex-1 overflow-y-auto">
              {venta.situacion === "cancelada" && venta.cancelacion && (
                <VentaCanceladaBanner cancelacion={venta.cancelacion} />
              )}

              <VentaDetalleHero venta={venta} />
              <VentaWorkflowTimeline venta={venta} />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="px-8 pb-24 pt-6">
                <TabsList className="h-9 w-full justify-start gap-1 rounded-none border-b border-border/60 bg-transparent p-0">
                  <UnderlineTab value="resumen" label="Resumen" />
                  <UnderlineTab value="ubicacion" label="Cliente y ubicación" />
                  <UnderlineTab
                    value="imagenes"
                    label="Imágenes"
                    count={venta.imagenes.length}
                  />
                  <UnderlineTab value="auditoria" label="Auditoría" />
                </TabsList>

                <TabsContent value="resumen" className="mt-6 space-y-8">
                  <VentaProductosTable venta={venta} />
                  <VentaVendedoresList vendedores={venta.vendedores} />
                  {venta.tipo_venta === "CREDITO" && <VentaPlanCreditoCard venta={venta} />}
                  {venta.nota && (
                    <section>
                      <h3 className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Nota
                      </h3>
                      <blockquote className="border-l-2 border-foreground/20 pl-4 font-serif text-base italic leading-relaxed text-foreground/80">
                        {venta.nota}
                      </blockquote>
                    </section>
                  )}
                </TabsContent>

                <TabsContent value="ubicacion" className="mt-6">
                  <VentaUbicacionTab venta={venta} />
                </TabsContent>

                <TabsContent value="imagenes" className="mt-6">
                  <VentaImagenesGrid ventaId={venta.id} imagenes={venta.imagenes} />
                </TabsContent>

                <TabsContent value="auditoria" className="mt-6">
                  <VentaAuditoriaTab venta={venta} />
                </TabsContent>
              </Tabs>
            </div>

            <VentaActionBar venta={venta} onClose={onClose} onUpdated={handleUpdated} />
          </div>
        )}

        {editOpen && venta && (
          isNuevoEditor() ? (
            <EditarVentaModal
              venta={venta}
              open={editOpen}
              onOpenChange={setEditOpen}
              onSuccess={() => { refetch(); }}
            />
          ) : (
            <EditarVentaSheet
              venta={venta}
              open={editOpen}
              onOpenChange={setEditOpen}
              onSuccess={() => { refetch(); }}
            />
          )
        )}

        <MobileNotice />
      </DialogContent>
    </Dialog>
  );
};

const UnderlineTab = ({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count?: number;
}) => (
  <TabsTrigger
    value={value}
    className={cn(
      "relative h-9 rounded-none border-0 bg-transparent px-3 text-xs font-medium text-muted-foreground shadow-none transition-colors",
      "data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
      "after:absolute after:inset-x-3 after:bottom-[-1px] after:h-[2px] after:bg-transparent",
      "data-[state=active]:after:bg-foreground"
    )}
  >
    {label}
    {count != null && (
      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/70">{count}</span>
    )}
  </TabsTrigger>
);

const MobileNotice = () => (
  <div className="pointer-events-none fixed inset-0 z-[200] hidden items-center justify-center bg-background p-8 max-[767px]:flex">
    <div className="pointer-events-auto max-w-xs space-y-2 text-center">
      <p className="font-serif text-xl font-normal">Pantalla muy pequeña</p>
      <p className="text-sm text-muted-foreground">
        Esta vista está optimizada para escritorio. Abre la venta desde una pantalla
        de al menos 768px de ancho.
      </p>
    </div>
  </div>
);

const ErrorView = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
    <p className="font-serif text-xl font-normal">No se pudo cargar la venta</p>
    <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    <Button variant="outline" size="sm" onClick={onClose}>
      Cerrar
    </Button>
    <p className="mt-2 font-mono text-[10px] text-muted-foreground/60">
      {dayjs().format("DD MMM YYYY · HH:mm")}
    </p>
  </div>
);

export default VentaDetalleModal;
