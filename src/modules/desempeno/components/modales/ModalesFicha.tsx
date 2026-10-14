import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClienteFicha, PagoModal, VentaModal } from "@/modules/clientes";
import type { Actividad } from "../../domain/entities";
import { ModalActividadDetalle } from "./ModalActividadDetalle";

export type ModalFicha =
  | { tipo: "actividad"; actividad: Actividad }
  | { tipo: "pago"; clienteId: number; doctoCcId: number }
  | { tipo: "venta"; clienteId: number; doctoPvId: number }
  | { tipo: "cliente"; clienteId: number };

// Identidad de un modal: qué muestra, no en qué posición está.
function identidad(m: ModalFicha): string {
  switch (m.tipo) {
    case "actividad":
      return `actividad:${m.actividad.id}`;
    case "pago":
      return `pago:${m.clienteId}:${m.doctoCcId}`;
    case "venta":
      return `venta:${m.clienteId}:${m.doctoPvId}`;
    case "cliente":
      return `cliente:${m.clienteId}`;
  }
}

// Claves estables por identidad. Si el mismo modal aparece otra vez más arriba
// (venta → pago → la misma venta), la repetición lleva su número de aparición:
// la pila solo crece o se cierra por arriba, así que ese número no cambia.
function clavesDe(pila: readonly ModalFicha[]): string[] {
  const vistas = new Map<string, number>();
  return pila.map((m) => {
    const id = identidad(m);
    const n = (vistas.get(id) ?? 0) + 1;
    vistas.set(id, n);
    return n === 1 ? id : `${id}#${n}`;
  });
}

// Pila de modales de la ficha (D11: se reutilizan los de Clientes). Un pago con
// docto_cc_id abre el PagoModal de Clientes; una visita o un pago que aún no
// llega a Microsip abre el modal propio. Se pueden encadenar (pago → venta →
// cliente) como en el mock. Los modales de Clientes necesitan su contexto: la
// integración envuelve la pantalla con ClientesContainer.
export function ModalesFicha({
  pila,
  onCerrar,
  onAbrir,
}: {
  pila: readonly ModalFicha[];
  onCerrar: () => void;
  onAbrir: (m: ModalFicha) => void;
}) {
  const claves = clavesDe(pila);
  return (
    <>
      {pila.map((m, i) => {
        const clave = claves[i];
        if (m.tipo === "actividad") {
          const a = m.actividad;
          if (a.pago && a.pago.doctoCcId !== null) {
            return (
              <PagoModal
                key={clave}
                clienteId={a.clienteId}
                doctoCcId={a.pago.doctoCcId}
                onClose={onCerrar}
                onAbrirVenta={(doctoPvId) => onAbrir({ tipo: "venta", clienteId: a.clienteId, doctoPvId })}
                onAbrirCliente={() => onAbrir({ tipo: "cliente", clienteId: a.clienteId })}
              />
            );
          }
          return (
            <ModalActividadDetalle
              key={clave}
              actividad={a}
              onClose={onCerrar}
              onAbrirCliente={(clienteId) => onAbrir({ tipo: "cliente", clienteId })}
              onAbrirVenta={(clienteId, doctoPvId) => onAbrir({ tipo: "venta", clienteId, doctoPvId })}
            />
          );
        }
        if (m.tipo === "pago") {
          return (
            <PagoModal
              key={clave}
              clienteId={m.clienteId}
              doctoCcId={m.doctoCcId}
              onClose={onCerrar}
              onAbrirVenta={(doctoPvId) => onAbrir({ tipo: "venta", clienteId: m.clienteId, doctoPvId })}
              onAbrirCliente={() => onAbrir({ tipo: "cliente", clienteId: m.clienteId })}
            />
          );
        }
        if (m.tipo === "venta") {
          return (
            <VentaModal
              key={clave}
              clienteId={m.clienteId}
              doctoPvId={m.doctoPvId}
              open
              onClose={onCerrar}
              onPagoClick={(doctoCcId) => onAbrir({ tipo: "pago", clienteId: m.clienteId, doctoCcId })}
            />
          );
        }
        return (
          <Dialog key={clave} open onOpenChange={(o) => !o && onCerrar()}>
            <DialogContent className="block h-[92vh] w-[96vw] max-w-[1180px] overflow-y-auto p-0 [&_button.absolute.right-4.top-4]:hidden">
              <DialogTitle className="sr-only">Ficha del cliente</DialogTitle>
              <DialogDescription className="sr-only">ficha del cliente</DialogDescription>
              <div className="sticky top-0 z-10 flex justify-end bg-background px-4 py-2">
                <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onCerrar} className="h-7 w-7">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ClienteFicha clienteId={m.clienteId} />
            </DialogContent>
          </Dialog>
        );
      })}
    </>
  );
}
