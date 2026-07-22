import "./cola.css";
import type { ConversacionResumen } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { colaBucket } from "../../domain/helpers";
import { QueueItem } from "./QueueItem";

export type ColaPanelProps = {
  items: ConversacionResumen[];
  loading: boolean;
  error: DomainError | null;
  selectedClienteId: number | null;
  onSelect: (clienteId: number) => void;
};

// ColaPanel is the left column: the review queue, grouped into "Te
// necesitan" (needs a human — escalated, buying signal, debt mention, or
// low-confidence draft) and "Al día" (everything else), per
// domain/helpers.ts#colaBucket. Purely driven by props so it's trivial to
// unit test and so the screen can combine its refetch with the
// conversación's for the composer's onDone.
export function ColaPanel({ items, loading, error, selectedClienteId, onSelect }: ColaPanelProps) {
  const teNecesitan = items.filter((i) => colaBucket(i) === "te_necesitan");
  const alDia = items.filter((i) => colaBucket(i) === "al_dia");

  return (
    <>
      <div className="bandeja-col-head">
        <span className="bandeja-col-title">Bandeja</span>
        <span className="bandeja-col-count tnum">
          {loading && items.length === 0 ? "…" : `${items.length} activas`}
        </span>
      </div>
      <div className="bandeja-col-body">
        {error ? (
          <p className="bandeja-error">{error.message}</p>
        ) : loading && items.length === 0 ? (
          <p className="bandeja-loading">Cargando bandeja…</p>
        ) : items.length === 0 ? (
          <p className="bandeja-empty">Sin conversaciones activas</p>
        ) : (
          <>
            {teNecesitan.length > 0 && (
              <>
                <div className="bandeja-qsec">
                  Te necesitan <span className="bandeja-qsec-badge tnum">{teNecesitan.length}</span>
                </div>
                {teNecesitan.map((item) => (
                  <QueueItem
                    key={item.clienteId}
                    item={item}
                    active={item.clienteId === selectedClienteId}
                    onClick={() => onSelect(item.clienteId)}
                  />
                ))}
              </>
            )}
            {alDia.length > 0 && (
              <>
                <div className="bandeja-qsec">Al día</div>
                {alDia.map((item) => (
                  <QueueItem
                    key={item.clienteId}
                    item={item}
                    active={item.clienteId === selectedClienteId}
                    onClick={() => onSelect(item.clienteId)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
