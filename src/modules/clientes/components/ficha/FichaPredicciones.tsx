import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ScoreMeter, type MeterBand } from "./ScoreMeter";
import { formatMoney } from "../lib/format";
import { usePredicciones } from "../../presentation/hooks/usePredicciones";
import { Panel } from "./lib/Panel";

// ─── P(activo) bands — [0,1] ─────────────────────────────────────────────────

const PALIVE_BANDS: MeterBand[] = [
  { label: "Inactivo", min: 0, color: "red" },
  { label: "Riesgo", min: 0.4, color: "amber" },
  { label: "Activo", min: 0.7, color: "green" },
];

function deriveActiveBand(punto: number): string {
  if (punto >= 0.7) return "Activo";
  if (punto >= 0.4) return "Riesgo";
  return "Inactivo";
}

// ─── CLV interval chart ───────────────────────────────────────────────────────

const CHART_HEIGHT = 80;
const AXIS_STYLE = {
  fontSize: 9,
  fontFamily: "var(--font-mono, ui-monospace)",
  fill: "hsl(var(--muted-foreground))",
};

const MXN_COMPACT = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  notation: "compact",
  maximumFractionDigits: 0,
});

interface ClvChartProps {
  punto: number;
  lo: number;
  hi: number;
}

function ClvIntervalChart({ punto, lo, hi }: ClvChartProps) {
  // Two identical data points produce a flat horizontal band spanning [lo, hi].
  // The two-series stack technique: transparent base at `lo`, filled band of height `hi−lo`.
  const data = [
    { x: "mín", base: lo, band: hi - lo },
    { x: "máx", base: lo, band: hi - lo },
  ];

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <XAxis dataKey="x" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v: number) => MXN_COMPACT.format(v)}
        />
        {/* Transparent baseline raises the filled band from 0 up to lo */}
        <Area
          type="monotone"
          dataKey="base"
          stackId="clv"
          fill="transparent"
          stroke="none"
          isAnimationActive={false}
        />
        {/* Filled band from lo to hi — the actual uncertainty interval */}
        <Area
          type="monotone"
          dataKey="band"
          stackId="clv"
          fill="hsl(var(--primary) / 0.15)"
          stroke="hsl(var(--primary))"
          strokeWidth={1}
          isAnimationActive={false}
        />
        {/* Punto estimate marked as a dashed horizontal reference */}
        <ReferenceLine
          y={punto}
          strokeDasharray="3 3"
          stroke="hsl(var(--foreground))"
          strokeOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface Props {
  clienteId: number;
}

export function FichaPredicciones({ clienteId }: Props) {
  const { predicciones } = usePredicciones(clienteId);

  if (!predicciones) return null;

  if (!predicciones.disponible) {
    return (
      <section
        className="border-b border-border/60 px-8 py-8"
        aria-label="Predicciones bayesianas"
      >
        <div className="mb-4">
          <h3 className="font-serif text-base font-normal text-foreground">
            Predicciones
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            modelo bayesiano · BG/NBD + Gamma-Gamma
          </p>
        </div>
        <p className="font-mono text-[11px] italic text-muted-foreground/60">
          Sin predicción
        </p>
      </section>
    );
  }

  const { pAlive, proximaCompraDias, clv, comprasEsperadas12m } = predicciones;
  const activeBand = deriveActiveBand(pAlive.punto);

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Predicciones bayesianas"
    >
      <div className="mb-6">
        <h3 className="font-serif text-base font-normal text-foreground">
          Predicciones
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          modelo bayesiano · BG/NBD + Gamma-Gamma
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* ── P(activo) ── */}
        <Panel
          title="P(activo)"
          titleHint="Probabilidad de que el cliente siga siendo activo (modelo BG/NBD)."
          subtitle="probabilidad activo"
        >
          <p className="flex items-baseline justify-between gap-2">
            <span className="font-serif text-2xl font-normal text-foreground">
              {Math.round(pAlive.punto * 100)}%
            </span>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
              {Math.round(pAlive.lo * 100)}–{Math.round(pAlive.hi * 100)}%
            </span>
          </p>
          <ScoreMeter
            value={pAlive.punto}
            min={0}
            max={1}
            bands={PALIVE_BANDS}
            activeBand={activeBand}
          />
          <p className="font-mono text-[10px] text-muted-foreground/60">
            IC 90%: {Math.round(pAlive.lo * 100)}–{Math.round(pAlive.hi * 100)}%
          </p>
        </Panel>

        {/* ── Próxima compra ── */}
        <Panel
          title="Próxima compra"
          titleHint="Días estimados hasta la siguiente compra (percentil 50 del modelo)."
          subtitle="días estimados"
        >
          <p className="flex items-baseline justify-between gap-2">
            <span className="font-serif text-2xl font-normal text-foreground">
              ~{proximaCompraDias.punto} días
            </span>
          </p>
          <p className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
            Rango: {proximaCompraDias.lo}–{proximaCompraDias.hi} días
          </p>
          <p className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
            Compras esperadas 12m: ~{comprasEsperadas12m.punto.toFixed(1)}
          </p>
        </Panel>

        {/* ── CLV ── */}
        <Panel
          title="CLV estimado"
          titleHint="Valor económico esperado del cliente en los próximos 24 meses (Gamma-Gamma)."
          subtitle="valor 24 meses"
        >
          <p className="flex items-baseline justify-between gap-2">
            <span className="font-serif text-2xl font-normal text-foreground">
              {formatMoney(String(clv.punto))}
            </span>
          </p>
          <ClvIntervalChart
            punto={clv.punto}
            lo={clv.lo}
            hi={clv.hi}
          />
        </Panel>
      </div>
    </section>
  );
}
