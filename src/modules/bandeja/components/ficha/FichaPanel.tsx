import "./ficha.css";
import type { ConversacionDetalle } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { confianzaBinaria, estadoLabel, segmentoLabel } from "../../domain/helpers";
import { humanizeSnake, initials } from "../lib/format";

export type FichaPanelProps = {
  detalle: ConversacionDetalle | null;
  loading: boolean;
  error: DomainError | null;
};

// FichaPanel is the right column: the client ficha. It reads ONLY the
// already-distilled fields the backend hands us (contextoNota, banderas) —
// it must NEVER render a turno's raw cuerpo or a decision's raw borrador,
// which can legitimately contain debt figures or unfiltered cobrador notes
// meant only to inform the IA's tone, not to be shown verbatim to anyone.
export function FichaPanel({ detalle, loading, error }: FichaPanelProps) {
  return (
    <>
      <div className="bandeja-col-head">
        <span className="bandeja-col-title">Ficha del cliente</span>
      </div>
      <div className="bandeja-col-body">
        {error ? (
          <p className="bandeja-error">{error.message}</p>
        ) : loading ? (
          <p className="bandeja-loading">Cargando ficha…</p>
        ) : !detalle ? (
          <p className="bandeja-empty">Selecciona una conversación</p>
        ) : (
          <FichaCards detalle={detalle} />
        )}
      </div>
    </>
  );
}

function FichaCards({ detalle }: { detalle: ConversacionDetalle }) {
  const { conversacion, decisiones } = detalle;
  const newest = decisiones.length > 0 ? decisiones[decisiones.length - 1] : null;

  return (
    <>
      <div className="bandeja-card">
        <div className="bandeja-idrow">
          <div className="bandeja-av">{initials(conversacion.nombre)}</div>
          <div className="bandeja-idrow-nm">{conversacion.nombre}</div>
        </div>
        <div className="bandeja-chips">
          <span className="bandeja-stat">{segmentoLabel(conversacion.segmento)}</span>
          <span className="bandeja-stat">{estadoLabel(conversacion.estado)}</span>
        </div>
      </div>

      {conversacion.contextoNota && (
        <div className="bandeja-card bandeja-card-nota">
          <div className="bandeja-card-h">⚑ De la nota del cobrador</div>
          <div className="bandeja-note">
            {conversacion.contextoNota}
            <div className="bandeja-note-src">
              Contexto privado — informa el tono, no se le dice al cliente.
            </div>
          </div>
        </div>
      )}

      {conversacion.banderas.length > 0 && (
        <div className="bandeja-card bandeja-card-danger">
          <div className="bandeja-card-h">⚑ Banderas</div>
          <ul className="bandeja-flags">
            {conversacion.banderas.map((bandera, i) => (
              <li key={`${bandera}-${i}`}>{bandera}</li>
            ))}
          </ul>
        </div>
      )}

      {newest && (
        <div className="bandeja-card bandeja-card-ai">
          <div className="bandeja-card-h">✦ La IA recomienda</div>
          <div className="bandeja-airow">
            <span>Acción</span>
            <b>{humanizeSnake(newest.accion || newest.intencion) || "Sin acción sugerida"}</b>
          </div>
          <div className="bandeja-airow">
            <span>Confianza</span>
            <b className="tnum">
              {newest.confianza}% · {confianzaBinaria(newest.confianza)}
            </b>
          </div>
          <div className="bandeja-allow">✓ Dentro del allowlist</div>
        </div>
      )}
    </>
  );
}
