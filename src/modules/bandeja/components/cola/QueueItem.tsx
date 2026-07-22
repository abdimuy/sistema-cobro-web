import type { ConversacionResumen } from "../../domain/entities";
import { segmentoLabel } from "../../domain/helpers";
import { formatElapsed } from "../lib/format";
import { queueItemHint } from "./queueItemHint";

type Props = {
  item: ConversacionResumen;
  active: boolean;
  onClick: () => void;
};

// QueueItem is one row of the bandeja queue (mockup `.qitem`): segment chip,
// nombre, relative time, and a preview/status line with the binary
// confidence dot. Purely presentational — colaBucket decides which section
// it renders under, queueItemHint decides what the second line says.
export function QueueItem({ item, active, onClick }: Props) {
  const hint = queueItemHint(item);
  const chipVariant = item.segmento.startsWith("recien") ? "rl" : "pl";

  return (
    <button
      type="button"
      className={`bandeja-qitem${active ? " bandeja-qitem-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
      data-testid={`queue-item-${item.clienteId}`}
    >
      <div className="bandeja-qitem-r1">
        <span className={`bandeja-chip bandeja-chip-${chipVariant}`}>
          {segmentoLabel(item.segmento)}
        </span>
        <span className="bandeja-qitem-nm">{item.nombre}</span>
        <span className="bandeja-qitem-time tnum">{formatElapsed(item.updatedAt)}</span>
      </div>
      <div className="bandeja-qitem-r2">
        {hint.confDot && (
          <span className={`bandeja-conf-dot bandeja-conf-dot-${hint.confDot}`} />
        )}
        {hint.tag ? (
          <span className={`bandeja-tag bandeja-tag-${hint.tag}`}>{hint.text}</span>
        ) : (
          <span>{hint.text}</span>
        )}
      </div>
    </button>
  );
}
