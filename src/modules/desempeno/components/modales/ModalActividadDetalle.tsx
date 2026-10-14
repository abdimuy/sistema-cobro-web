import type { ReactNode } from "react";
import { MapPinOff, Receipt, User, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { refImagenesDeActividad, type Actividad, type TipoActividad } from "../../domain/entities";
import { diaDeNegocioDe, dinero2, fechaLarga, horaCorta } from "../lib/format";
import { FORMA_COBRO_ETIQUETA } from "../lib/tipoActividadMeta";
import { GaleriaFotos } from "./GaleriaFotos";

const MIGA: Record<TipoActividad, string> = {
  pago: "Pagos",
  visita: "Visitas",
  condonacion: "Condonaciones",
};

function Seccion({ titulo, children, ancha }: { titulo: string; children: ReactNode; ancha?: boolean }) {
  return (
    <section className={cn(ancha && "col-span-2")}>
      <h4 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{titulo}</h4>
      {children}
    </section>
  );
}

function Fila({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <dt className="font-mono text-[11px] text-muted-foreground">{k}</dt>
      <dd className="text-right text-sm">{v}</dd>
    </div>
  );
}

function estadoPago(a: Actividad): string | null {
  if (!a.pago) return null;
  if (a.pago.rechazado) return "Rechazado";
  return a.pago.aplicado ? "Aplicado" : "Sin aplicar";
}

// Modal de visita (nuevo, mismo estilo que PagoModal de Clientes) y de pago que
// aún no tiene docto_cc_id (no se puede abrir el detalle de Clientes). Todo sale
// del objeto Actividad del contrato; las fotos, de GET .../imagenes. La etiqueta
// de la visita y la captura tardía las decide el servidor (contrato v2, D10).
export function ModalActividadDetalle({
  actividad: a,
  onClose,
  onAbrirCliente,
  onAbrirVenta,
}: {
  actividad: Actividad;
  onClose: () => void;
  onAbrirCliente: (clienteId: number) => void;
  // Solo se ofrece si la actividad trae docto_pv_id (contrato v2).
  onAbrirVenta?: (clienteId: number, doctoPvId: number) => void;
}) {
  const esVisita = a.visita !== null;
  const estado = estadoPago(a);
  const doctoPvId = a.doctoPvId;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="block max-h-[90vh] w-[94vw] max-w-[640px] gap-0 overflow-hidden p-0 [&_button.absolute.right-4.top-4]:hidden">
        <DialogTitle className="sr-only">{esVisita ? "Detalle de visita" : "Detalle de pago"}</DialogTitle>
        <DialogDescription className="sr-only">detalle del movimiento</DialogDescription>
        <header className="flex h-[60px] items-center justify-between border-b border-border/60 px-6 text-xs">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-muted-foreground">{MIGA[a.tipo]}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="truncate font-mono tracking-wider">{a.folio ?? a.id}</span>
            {estado && (
              <span className="rounded-full bg-dsm-ambar-fondo px-2 py-0.5 font-mono text-[10px] uppercase text-dsm-ambar">
                {estado}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" className="h-7 w-7">
            <X className="h-3.5 w-3.5" />
          </Button>
        </header>
        <div className="overflow-y-auto px-8 pb-10 pt-6" style={{ maxHeight: "calc(90vh - 60px - 64px)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] text-muted-foreground first-letter:uppercase">
                {`${fechaLarga(diaDeNegocioDe(a.hora))} · ${horaCorta(a.hora)}`}
              </p>
              <h2 className="font-serif text-2xl">{a.clienteNombre}</h2>
              <p className="font-mono text-[11px] text-muted-foreground">{a.folio ?? "Sin venta"}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {esVisita ? "Resultado" : "Importe"}
              </p>
              <p className="font-serif text-[28px] leading-tight">
                {a.visita ? a.visita.etiqueta : a.pago ? dinero2(a.pago.importe) : "—"}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6">
            {a.visita?.nota && (
              <Seccion titulo="Nota del cobrador" ancha>
                <blockquote className="border-l-2 border-border pl-3 text-sm italic">{`“${a.visita.nota}”`}</blockquote>
              </Seccion>
            )}
            <Seccion titulo={esVisita ? "Visita" : "Cómo se pagó"}>
              <dl>
                {a.visita && <Fila k="Tipo" v={a.visita.tipoVisita} />}
                {a.pago && <Fila k="Forma" v={FORMA_COBRO_ETIQUETA[a.pago.formaCobro]} />}
                <Fila k="Venta" v={a.folio ?? "—"} />
              </dl>
            </Seccion>
            <Seccion titulo="Quién lo registró">
              <dl>
                <Fila k="Registró" v={a.registradoPor.nombre} />
                <Fila k="Origen" v={a.registradoPor.origen === "oficina" ? "Oficina" : "App de cobranza"} />
              </dl>
            </Seccion>
            <Seccion titulo="Dónde se registró">
              {a.conGps && a.lat !== null && a.lng !== null ? (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px]">{`${a.lat}, ${a.lng}`}</span>
                  <a
                    href={`https://www.google.com/maps?q=${a.lat},${a.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Ver en Maps ↗
                  </a>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-[13px] text-dsm-ambar">
                  <MapPinOff aria-hidden className="h-3.5 w-3.5" />
                  {a.registradoPor.origen === "oficina"
                    ? "Capturado en oficina, sin ubicación."
                    : "El teléfono no mandó ubicación."}
                </p>
              )}
            </Seccion>
            <Seccion titulo="Captura y llegada">
              <dl>
                <Fila k="Capturado en el teléfono" v={horaCorta(a.hora)} />
                <Fila k="Llegó al servidor" v={a.recibidoAt ? horaCorta(a.recibidoAt) : "—"} />
              </dl>
              {a.capturaTardia && (
                <span className="mt-1 inline-block rounded-full bg-dsm-ambar-fondo px-2 py-0.5 font-mono text-[10px] uppercase text-dsm-ambar">
                  Captura tardía
                </span>
              )}
            </Seccion>
            <Seccion titulo={a.numFotos > 0 ? `Fotos · ${a.numFotos}` : "Fotos"} ancha>
              <GaleriaFotos
                refImagenes={refImagenesDeActividad(a)}
                mensajeSinFotos={a.pago && !a.pago.pagoRecibidoId ? "Sin comprobante" : "No se tomaron fotos"}
              />
            </Seccion>
          </div>
        </div>
        <footer className="flex h-16 items-center justify-end gap-2 border-t border-border/60 px-6">
          <Button variant="outline" size="sm" onClick={() => onAbrirCliente(a.clienteId)}>
            <User aria-hidden className="mr-1.5 h-3.5 w-3.5" />
            Ficha del cliente
          </Button>
          {onAbrirVenta && doctoPvId !== null && (
            <Button size="sm" onClick={() => onAbrirVenta(a.clienteId, doctoPvId)}>
              <Receipt aria-hidden className="mr-1.5 h-3.5 w-3.5" />
              Detalle de venta
            </Button>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
