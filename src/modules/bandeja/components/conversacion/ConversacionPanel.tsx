import "./conversacion.css";
import type { ConversacionDetalle } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { estadoLabel, modoConversacion, segmentoLabel } from "../../domain/helpers";
import { initials, maskTelefono } from "../lib/format";
import { Hilo } from "./Hilo";
import { BorradorComposer } from "./BorradorComposer";

export type ConversacionPanelProps = {
  detalle: ConversacionDetalle | null;
  loading: boolean;
  error: DomainError | null;
  // Combined callback: refetches BOTH the queue and this conversación's
  // detail once an action (aprobar/editar/dictar/escalar) completes — see
  // BandejaScreen, which owns both hooks and wires this in.
  onDone: () => void;
};

// ConversacionPanel is the middle column: the thread plus, when the newest
// decision is an un-actioned draft (modoConversacion === 'borrador'), the
// violet AI composer. The escalated case ('briefing') is a placeholder here
// — Task 5 replaces it with the full briefing view.
export function ConversacionPanel({ detalle, loading, error, onDone }: ConversacionPanelProps) {
  if (error) {
    return (
      <div className="bandeja-col-body">
        <p className="bandeja-error">{error.message}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bandeja-col-body">
        <p className="bandeja-loading">Cargando conversación…</p>
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="bandeja-col-body">
        <p className="bandeja-empty">Selecciona una conversación</p>
      </div>
    );
  }

  const { conversacion, turnos, decisiones } = detalle;
  const modo = modoConversacion(detalle);
  const newest = decisiones.length > 0 ? decisiones[decisiones.length - 1] : null;

  return (
    <>
      <div className="bandeja-conv-head">
        <div className="bandeja-av">{initials(conversacion.nombre)}</div>
        <div>
          <div className="bandeja-conv-head-nm">{conversacion.nombre}</div>
          <div className="bandeja-conv-head-sub">
            {segmentoLabel(conversacion.segmento)} · {maskTelefono(conversacion.telefono)}
          </div>
        </div>
        <div className="bandeja-state">{estadoLabel(conversacion.estado)}</div>
      </div>

      <Hilo turnos={turnos} />

      {modo === "borrador" && newest && (
        <BorradorComposer clienteId={conversacion.clienteId} decision={newest} onDone={onDone} />
      )}

      {modo === "briefing" && (
        <div className="bandeja-draft-wrap">
          <p className="bandeja-empty">
            Esta conversación fue escalada — la vista de briefing llega en la siguiente entrega.
          </p>
        </div>
      )}
    </>
  );
}
