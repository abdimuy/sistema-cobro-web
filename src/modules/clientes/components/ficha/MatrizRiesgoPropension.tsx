import { formatMoneyShort } from "../lib/format";
import type { Pulso } from "../../domain/entities/FichaCliente";

// ─── Cell definitions ─────────────────────────────────────────────────────────

type CellKey = "vender" | "reactivar" | "enganche" | "noExtender";

interface CellDef {
  key: CellKey;
  label: string;
  sublabel: string;
  // Tailwind classes for the default (non-highlighted) state
  base: string;
  // Additional classes applied when this is the client's cell
  highlight: string;
}

const CELLS: Record<CellKey, CellDef> = {
  vender: {
    key: "vender",
    label: "Vender más",
    sublabel: "subir línea de crédito",
    base: "border-green-500/20 bg-green-500/5 text-green-700",
    highlight:
      "ring-2 ring-green-500 border-green-500/60 bg-green-500/15 text-green-800",
  },
  reactivar: {
    key: "reactivar",
    label: "Reactivar",
    sublabel: "campaña de reactivación",
    base: "border-blue-500/20 bg-blue-500/5 text-blue-700",
    highlight:
      "ring-2 ring-blue-500 border-blue-500/60 bg-blue-500/15 text-blue-800",
  },
  enganche: {
    key: "enganche",
    label: "Vender con enganche",
    sublabel: "crédito condicionado",
    base: "border-amber-500/20 bg-amber-500/5 text-amber-700",
    highlight:
      "ring-2 ring-amber-500 border-amber-500/60 bg-amber-500/15 text-amber-800",
  },
  noExtender: {
    key: "noExtender",
    label: "No extender",
    sublabel: "priorizar cobranza",
    base: "border-red-500/20 bg-red-500/5 text-red-700",
    highlight:
      "ring-2 ring-red-500 border-red-500/60 bg-red-500/15 text-red-800",
  },
};

// ─── Cell placement logic ─────────────────────────────────────────────────────

function resolveCell(
  bandaCredito: string,
  bandaRecompra: string,
): CellKey {
  const esBajoRiesgo =
    bandaCredito === "BAJO" || bandaCredito === "MEDIO";
  const esAltaPropension = bandaRecompra === "ALTA";

  if (esBajoRiesgo && esAltaPropension) return "vender";
  if (esBajoRiesgo && !esAltaPropension) return "reactivar";
  if (!esBajoRiesgo && esAltaPropension) return "enganche";
  return "noExtender";
}

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
