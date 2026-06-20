import { lazy, Suspense } from "react";
import { X } from "lucide-react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { usePagoDetalle } from "../../presentation/hooks/usePagoDetalle";
import { categoriaMeta } from "../lib/pagoConcepto";
import { formatMoney } from "../lib/format";

// FichaMapEmbed is lazy-loaded — avoids pulling in the maps bundle for closed modals.
const FichaMapEmbed = lazy(() =>
  import("../ficha/FichaMapEmbed").then((m) => ({ default: m.FichaMapEmbed })),
);

const fmtDateWithSeconds = (d: Date | null): string =>
  d ? dayjs(d).format("DD MMM YYYY · HH:mm:ss") : "—";

interface Props {
  clienteId: number;
  doctoCcId: number | null;
  onClose: () => void;
}

export function PagoModal({ clienteId, doctoCcId, onClose }: Props) {
  const { detalle, isLoading, error } = usePagoDetalle(clienteId, doctoCcId);
  const hasMapsKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  if (doctoCcId === null) return null;

  const meta = detalle ? categoriaMeta(detalle.categoria) : null;

  const showDiagnostico =
    detalle !== null &&
    (detalle.origen === "app" ||
      detalle.recibidoAt !== null ||
      detalle.aplicadoAt !== null);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          "[&_button.absolute.right-4.top-4]:hidden",
          "block max-w-[560px] w-[94vw] max-h-[90vh] gap-0 overflow-hidden p-0",
          "border-border/80 bg-background shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2 data-[state=open]:duration-300",
        )}
      >
        <DialogTitle className="sr-only">Detalle de pago</DialogTitle>
        <DialogDescription className="sr-only">detalle del pago</DialogDescription>

        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Pagos</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-mono text-foreground tracking-wider">
              {detalle ? detalle.folio : "—"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar"
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
              <Skeleton className="h-[120px] w-full" />
              <Skeleton className="h-[80px] w-full" />
            </div>
          )}

          {error && !detalle && (
            <div className="flex h-64 flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="font-serif text-xl font-normal">
                No se pudo cargar el pago
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {error.message}
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}

          {detalle && meta && (
            <div className="px-8 pb-16 space-y-8 pt-6">
              {/* ── Hero ── */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {dayjs(detalle.fecha).format("DD MMM YYYY · HH:mm")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className={meta.badgeClass}>{detalle.concepto}</span>
                    {detalle.aplicado && !detalle.cancelado && (
                      <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-green-500">
                        Aplicado
                      </span>
                    )}
                    {detalle.cancelado && (
                      <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-red-500">
                        Cancelado
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Importe
                  </p>
                  <p className="font-serif text-[34px] tabular-nums leading-none text-foreground">
                    {formatMoney(detalle.importe)}
                  </p>
                </div>
              </div>

              <hr className="border-border/60" />

              {/* ── Cómo se pagó ── */}
              {(detalle.formaCobro || detalle.referencia || (detalle.iva && detalle.iva !== "0.00")) && (
                <section>
                  <h4 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Cómo se pagó
                  </h4>
                  <dl className="space-y-2">
                    {detalle.formaCobro && (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[11px] text-muted-foreground">Forma</dt>
                        <dd className="text-sm text-foreground">{detalle.formaCobro}</dd>
                      </div>
                    )}
                    {detalle.referencia && (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[11px] text-muted-foreground">Referencia</dt>
                        <dd className="font-mono text-sm text-foreground">{detalle.referencia}</dd>
                      </div>
                    )}
                    {detalle.iva && detalle.iva !== "0.00" && (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[11px] text-muted-foreground">IVA incluido</dt>
                        <dd className="font-mono text-sm text-foreground">{formatMoney(detalle.iva)}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {/* ── Quién cobró ── */}
              <section>
                <h4 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Quién cobró
                </h4>
                <dl className="space-y-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[11px] text-muted-foreground">Cobrador</dt>
                    <dd className="text-sm text-foreground">{detalle.cobrador}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[11px] text-muted-foreground">Origen</dt>
                    <dd className="text-sm text-foreground">
                      {detalle.origen === "app" ? "App de cobranza" : "Microsip"}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* ── Ubicación ── */}
              {detalle.lat !== null && detalle.lon !== null && (
                <section>
                  <h4 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Ubicación
                  </h4>
                  <div className="h-[150px] overflow-hidden rounded-md border border-border/40">
                    {hasMapsKey ? (
                      <Suspense
                        fallback={
                          <div className="flex h-full items-center justify-center bg-muted/30">
                            <span className="font-mono text-[11px] text-muted-foreground/60">
                              Cargando mapa…
                            </span>
                          </div>
                        }
                      >
                        <FichaMapEmbed lat={detalle.lat} lng={detalle.lon} />
                      </Suspense>
                    ) : (
                      <div
                        className="flex h-full items-center justify-center bg-muted/30"
                        data-testid="mapa-no-disponible"
                      >
                        <p className="font-mono text-[11px] text-muted-foreground/60">
                          Mapa no disponible
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {detalle.lat}, {detalle.lon}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${detalle.lat},${detalle.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Ver en Maps ↗
                    </a>
                  </div>
                </section>
              )}

              {/* ── Aplicación ── */}
              <section>
                <h4 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Aplicación
                </h4>
                <dl className="space-y-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[11px] text-muted-foreground">Aplicado a</dt>
                    <dd className="text-sm text-foreground">Venta #{detalle.doctoPvId}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[11px] text-muted-foreground">Saldo del cargo</dt>
                    <dd className="font-mono text-sm text-foreground">
                      {detalle.saldoCargo !== null ? formatMoney(detalle.saldoCargo) : "—"}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="font-mono text-[11px] text-muted-foreground">Folio del abono</dt>
                    <dd className="font-mono text-sm text-foreground">{detalle.folio}</dd>
                  </div>
                </dl>
              </section>

              {/* ── Diagnóstico de sincronización ── */}
              {showDiagnostico && (
                <section>
                  <details className="group">
                    <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted-foreground list-none flex items-center gap-2">
                      <span className="transition-transform group-open:rotate-90">›</span>
                      Diagnóstico de sincronización
                    </summary>
                    <dl className="mt-3 space-y-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[11px] text-muted-foreground">Recibido</dt>
                        <dd className="font-mono text-[11px] text-foreground">
                          {fmtDateWithSeconds(detalle.recibidoAt)}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-mono text-[11px] text-muted-foreground">Aplicado en Microsip</dt>
                        <dd className="font-mono text-[11px] text-foreground">
                          {fmtDateWithSeconds(detalle.aplicadoAt)}
                        </dd>
                      </div>
                    </dl>
                  </details>
                </section>
              )}

              {/* ── Comprobante ── */}
              <section>
                <h4 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Comprobante
                </h4>
                <p className="font-mono text-[11px] italic text-muted-foreground">
                  Sin comprobante
                </p>
              </section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PagoModal;
