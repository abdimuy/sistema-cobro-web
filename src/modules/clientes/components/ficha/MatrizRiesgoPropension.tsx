import { formatMoneyShort } from "../lib/format";
import { CELLS, resolveCell, type CellKey } from "./lib/matrizAccion";
import type { Pulso } from "../../domain/entities/FichaCliente";

// ─── Individual cell ──────────────────────────────────────────────────────────

interface CellProps {
  cellKey: CellKey;
  activeKey: CellKey;
  clv?: string;
}

function MatrizCell({ cellKey, activeKey, clv }: CellProps) {
  const def = CELLS[cellKey];
  const isActive = cellKey === activeKey;
  const classes = isActive ? def.highlight : def.base;

  return (
    <div
      role="region"
      className={`flex flex-col gap-1 rounded-md border px-3 py-2.5 transition-colors ${classes}`}
      aria-label={isActive ? `Acción recomendada: ${def.label}` : def.label}
      aria-current={isActive ? "true" : undefined}
    >
      <span className="font-mono text-[11px] font-semibold leading-tight">
        {def.label}
      </span>
      <span className="font-mono text-[10px] opacity-70 leading-tight">
        {def.sublabel}
      </span>
      {isActive && clv && (
        <span className="font-mono text-[10px] font-medium tabular-nums mt-0.5 opacity-90">
          Valor: {formatMoneyShort(clv)}
        </span>
      )}
    </div>
  );
}

// ─── MatrizRiesgoPropension ───────────────────────────────────────────────────

interface Props {
  pulso: Pulso | null;
}

export function MatrizRiesgoPropension({ pulso }: Props) {
  // No-aplica: either score is missing → cannot place client
  if (!pulso?.bandaCredito || !pulso?.bandaRecompra) return null;

  const { bandaCredito, bandaRecompra, clv } = pulso;
  const activeKey = resolveCell(bandaCredito, bandaRecompra);

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Acción recomendada"
    >
      {/* Heading */}
      <div className="mb-5">
        <h3 className="font-serif text-base font-normal text-foreground">
          Acción recomendada
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          matriz riesgo × propensión
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-3">
        {/* Axis headers */}
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 items-end">
          {/* top-left corner: row axis label */}
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50 pb-1 pr-2">
            Riesgo ↓
          </span>
          {/* Column labels */}
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 text-center pb-1">
            Alta prop.
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 text-center pb-1">
            Baja prop.
          </span>
        </div>

        {/* Row 1: Bajo riesgo */}
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 items-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 pr-2 whitespace-nowrap">
            Bajo
          </span>
          <MatrizCell cellKey="vender" activeKey={activeKey} clv={clv} />
          <MatrizCell cellKey="reactivar" activeKey={activeKey} clv={clv} />
        </div>

        {/* Row 2: Alto riesgo */}
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 items-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 pr-2 whitespace-nowrap">
            Alto
          </span>
          <MatrizCell cellKey="enganche" activeKey={activeKey} clv={clv} />
          <MatrizCell cellKey="noExtender" activeKey={activeKey} clv={clv} />
        </div>
      </div>
    </section>
  );
}
