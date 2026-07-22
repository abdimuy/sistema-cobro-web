import "./bandeja.tokens.css";
import { useBandeja } from "./context/BandejaContext";
import { useCola } from "./hooks/useCola";
import { useConversacion } from "./hooks/useConversacion";

// BandejaScreen is the 3-column shell for the operator inbox (queue /
// conversation / ficha). This task (3) only wires the data hooks and lays
// out the grid — the real panels (queue rows, thread, AI draft composer,
// ficha cards) land in Tasks 4-5.
export function BandejaScreen() {
  const { selectedClienteId } = useBandeja();
  const cola = useCola();
  const conversacion = useConversacion(selectedClienteId);

  return (
    <div className="bandeja-root bandeja-shell">
      <div className="bandeja-top">Reactivación · Bandeja</div>

      <div className="bandeja-cols">
        <div className="bandeja-col bandeja-col-queue">
          <div className="bandeja-col-head">
            <span className="bandeja-col-title">Bandeja</span>
            <span className="bandeja-col-count tnum">
              {cola.loading ? "…" : `${cola.items.length} activas`}
            </span>
          </div>
          <div className="bandeja-col-body">
            {cola.error ? (
              <p className="bandeja-placeholder bandeja-placeholder-error">
                {cola.error.message}
              </p>
            ) : (
              <p className="bandeja-placeholder">Panel de cola — próximamente</p>
            )}
          </div>
        </div>

        <div className="bandeja-col bandeja-col-conv">
          <div className="bandeja-col-body">
            {conversacion.loading ? (
              <p className="bandeja-placeholder">Cargando conversación…</p>
            ) : conversacion.error ? (
              <p className="bandeja-placeholder bandeja-placeholder-error">
                {conversacion.error.message}
              </p>
            ) : selectedClienteId == null ? (
              <p className="bandeja-placeholder">Selecciona una conversación</p>
            ) : (
              <p className="bandeja-placeholder">Panel de conversación — próximamente</p>
            )}
          </div>
        </div>

        <div className="bandeja-col bandeja-col-ficha">
          <div className="bandeja-col-head">
            <span className="bandeja-col-title">Ficha del cliente</span>
          </div>
          <div className="bandeja-col-body">
            <p className="bandeja-placeholder">Panel de ficha — próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
