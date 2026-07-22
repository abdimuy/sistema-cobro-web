import "./simular.css";
// Reuses the generic .bandeja-btn/.bandeja-btn-primary button classes
// defined alongside the AI draft composer — imported explicitly so this
// component doesn't silently depend on ConversacionPanel having mounted
// first to pull conversacion.css in.
import "../conversacion/conversacion.css";
import { useState } from "react";
import { toast } from "sonner";
import { useBandeja } from "../../presentation/context/BandejaContext";
import { toDomainError } from "../../presentation/hooks/lib/toDomainError";
import { simularMensajeEntrante } from "../../application/usecases/simularMensajeEntrante";
import { humanizeSnake } from "../lib/format";

export type SimularEntranteControlProps = {
  // Same combined refetch callback the composer/briefing use (BandejaScreen
  // wires it to cola.refetch() + conversacion.refetch()) — reused as-is
  // rather than threading through a separate "which cliente changed" path:
  // conversacion.refetch() only ever touches the currently selected cliente,
  // so calling it after simulating an unrelated one is simply a harmless
  // no-op refresh.
  onDone: () => void;
};

// SimularEntranteControl is a dev/demo tool with no mockup equivalent — it
// lets an operator manufacture an inbound WhatsApp message without a real
// round-trip (e.g. to demo "buy signal → escalates" live). The whole
// /bandeja route is already admin-only via ProtectedRoute, so this needs no
// extra role check of its own. Kept visually subtle (a collapsible strip in
// the top bar) — it's a tool, not a primary surface.
export function SimularEntranteControl({ onDone }: SimularEntranteControlProps) {
  const { port } = useBandeja();
  const [open, setOpen] = useState(false);
  const [clienteIdText, setClienteIdText] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);

  const clienteId = Number(clienteIdText);
  const valido =
    clienteIdText.trim().length > 0 &&
    Number.isInteger(clienteId) &&
    clienteId > 0 &&
    mensaje.trim().length > 0;

  const handleSimular = async () => {
    if (!valido || sending) return;
    setSending(true);
    try {
      const result = await simularMensajeEntrante(port, clienteId, mensaje.trim());
      const accionTxt = humanizeSnake(result.accion) || "sin acción";
      toast.success(result.escalada ? "Mensaje simulado — se escaló" : "Mensaje simulado", {
        description: `Acción: ${accionTxt}`,
      });
      onDone();
    } catch (e) {
      const err = toDomainError(e);
      toast.error("No se pudo simular el mensaje entrante", { description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bandeja-simcontrol">
      <button
        type="button"
        className="bandeja-simcontrol-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        🧪 Simular entrante
      </button>
      {open && (
        <div className="bandeja-simcontrol-body">
          <input
            type="number"
            value={clienteIdText}
            onChange={(e) => setClienteIdText(e.target.value)}
            placeholder="cliente_id"
            aria-label="Cliente ID a simular"
            disabled={sending}
          />
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Mensaje entrante…"
            aria-label="Mensaje a simular"
            disabled={sending}
          />
          <button
            type="button"
            className="bandeja-btn bandeja-btn-primary"
            onClick={() => void handleSimular()}
            disabled={!valido || sending}
          >
            {sending ? "Simulando…" : "Simular entrante"}
          </button>
        </div>
      )}
    </div>
  );
}
