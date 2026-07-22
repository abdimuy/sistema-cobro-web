import "./bandeja.tokens.css";
import { useCallback } from "react";
import { useBandeja } from "./context/BandejaContext";
import { useCola } from "./hooks/useCola";
import { useConversacion } from "./hooks/useConversacion";
import { ColaPanel } from "../components/cola/ColaPanel";
import { ConversacionPanel } from "../components/conversacion/ConversacionPanel";
import { FichaPanel } from "../components/ficha/FichaPanel";

// BandejaScreen is the 3-column shell for the operator inbox (queue /
// conversation / ficha). It owns the two data hooks (useCola, useConversacion)
// at this level — rather than letting each leaf panel call its own copy —
// specifically so it can build ONE combined `onDone` callback (refetch both
// the queue AND the current conversación) and hand it to the composer via
// ConversacionPanel. That combination is the whole reason the hooks are
// lifted here instead of called inside ColaPanel/ConversacionPanel/FichaPanel
// directly; it also avoids double-polling the same endpoints from two
// independent hook instances.
export function BandejaScreen() {
  const { selectedClienteId, setSelectedClienteId } = useBandeja();
  const cola = useCola();
  const conversacion = useConversacion(selectedClienteId);

  // Depends only on the two stable `refetch` identities (each memoized with
  // useCallback in its own hook) — not on `cola`/`conversacion` themselves,
  // which are new objects every render and would make this re-create (and
  // re-trigger downstream effects) on every poll tick.
  const onDone = useCallback(() => {
    cola.refetch();
    conversacion.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cola.refetch, conversacion.refetch]);

  return (
    <div className="bandeja-root bandeja-shell">
      <div className="bandeja-top">Reactivación · Bandeja</div>

      <div className="bandeja-cols">
        <div className="bandeja-col bandeja-col-queue">
          <ColaPanel
            items={cola.items}
            loading={cola.loading}
            error={cola.error}
            selectedClienteId={selectedClienteId}
            onSelect={setSelectedClienteId}
          />
        </div>

        <div className="bandeja-col bandeja-col-conv">
          <ConversacionPanel
            detalle={conversacion.detalle}
            loading={conversacion.loading}
            error={conversacion.error}
            onDone={onDone}
          />
        </div>

        <div className="bandeja-col bandeja-col-ficha">
          <FichaPanel
            detalle={conversacion.detalle}
            loading={conversacion.loading}
            error={conversacion.error}
          />
        </div>
      </div>
    </div>
  );
}
