import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ScoreMeter, type MeterBand } from "./ScoreMeter";
import { formatMoney } from "../lib/format";
import { useBenchmark } from "../../presentation/hooks/useBenchmark";
import { Panel } from "./lib/Panel";
import type { CohortBy, MetricaBenchmark } from "../../domain/entities/Benchmark";

// ─── Percentil bands — same for all metrics (mayor = mejor) ─────────────────

const PERCENTIL_BANDS: MeterBand[] = [
  { label: "Bajo", min: 0, color: "red" },
  { label: "Regular", min: 25, color: "orange" },
  { label: "Bueno", min: 50, color: "amber" },
  { label: "Destacado", min: 75, color: "green" },
];

function deriveActiveBand(pct: number): string {
  if (pct >= 75) return "Destacado";
  if (pct >= 50) return "Bueno";
  if (pct >= 25) return "Regular";
  return "Bajo";
}

// ─── Mini distribution chart ─────────────────────────────────────────────────

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

interface MiniDistProps {
  p25: number;
  mediana: number;
  p75: number;
  valor: number;
  formatTick: (v: number) => string;
}

function MiniDist({ p25, mediana, p75, valor, formatTick }: MiniDistProps) {
  const data = [
    { x: "p25", v: p25, cliente: false },
    { x: "med", v: mediana, cliente: false },
    { x: "p75", v: p75, cliente: false },
    { x: "tú", v: valor, cliente: true },
  ];

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="x"
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={formatTick}
        />
        <Bar dataKey="v" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.cliente
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground) / 0.25)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Metric panel ─────────────────────────────────────────────────────────────

type MetricaKey = "puntualidad" | "clv" | "credito" | "recompra";

interface MetricaConfig {
  key: MetricaKey;
  label: string;
  subtitle: string;
  hint: string;
  formatValor: (v: number) => string;
  formatTick: (v: number) => string;
}

const METRICAS: MetricaConfig[] = [
  {
    key: "puntualidad",
    label: "Puntualidad",
    subtitle: "% pagos a tiempo",
    hint: "Porcentaje de pagos realizados a tiempo.",
    formatValor: (v) => `${v.toFixed(1)}%`,
    formatTick: (v) => `${v}%`,
  },
  {
    key: "clv",
    label: "CLV",
    subtitle: "valor esperado",
    hint: "Valor de vida del cliente (Gamma-Gamma).",
    formatValor: (v) => formatMoney(String(v)),
    formatTick: (v) => MXN_COMPACT.format(v),
  },
  {
    key: "credito",
    label: "Solvencia",
    subtitle: "score 0–100",
    hint: "Score de solvencia crediticia (mayor = mejor, más solvente).",
    formatValor: (v) => String(Math.round(v)),
    formatTick: (v) => String(v),
  },
  {
    key: "recompra",
    label: "Recompra",
    subtitle: "propensión 0–100",
    hint: "Propensión a recompra (mayor = más probable).",
    formatValor: (v) => String(Math.round(v)),
    formatTick: (v) => String(v),
  },
];

interface MetricaPanelProps {
  config: MetricaConfig;
  metrica: MetricaBenchmark;
}

function MetricaPanel({ config, metrica }: MetricaPanelProps) {
  if (!metrica.aplica) {
    return (
      <Panel title={config.label} subtitle={config.subtitle}>
        <p className="font-mono text-[11px] italic text-muted-foreground/60">
          Sin dato
        </p>
      </Panel>
    );
  }

  if (metrica.muestraPequena) {
    return (
      <Panel title={config.label} subtitle={config.subtitle}>
        <p className="font-mono text-[11px] italic text-muted-foreground/60">
          Muestra pequeña
        </p>
      </Panel>
    );
  }

  const activeBand = deriveActiveBand(metrica.percentil);

  return (
    <Panel
      title={config.label}
      subtitle={config.subtitle}
      titleHint={config.hint}
    >
      <p className="flex items-baseline justify-between gap-2">
        <span className="font-serif text-2xl font-normal text-foreground">
          {config.formatValor(metrica.valor)}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
          pct {metrica.percentil}
        </span>
      </p>
      <ScoreMeter
        value={metrica.percentil}
        min={0}
        max={100}
        bands={PERCENTIL_BANDS}
        activeBand={activeBand}
      />
      <p className="font-mono text-[10px] text-muted-foreground/60">
        Mediana: {config.formatValor(metrica.mediana)}
      </p>
      <MiniDist
        p25={metrica.p25}
        mediana={metrica.mediana}
        p75={metrica.p75}
        valor={metrica.valor}
        formatTick={config.formatTick}
      />
    </Panel>
  );
}

// ─── Cohort selector ──────────────────────────────────────────────────────────

const COHORT_OPTIONS: { value: CohortBy; label: string }[] = [
  { value: "zona", label: "Zona" },
  { value: "segmento", label: "Segmento" },
  { value: "antiguedad", label: "Antigüedad" },
];

// ─── Public component ─────────────────────────────────────────────────────────

interface Props {
  clienteId: number;
}

export function FichaBenchmark({ clienteId }: Props) {
  const [cohortBy, setCohortBy] = useState<CohortBy>("zona");
  const { benchmark, error } = useBenchmark(clienteId, cohortBy);

  if (!benchmark) {
    if (!error) return null;
    return (
      <section
        className="border-b border-border/60 px-8 py-8"
        aria-label="Benchmark de pares"
      >
        <div className="mb-4">
          <h3 className="font-serif text-base font-normal text-foreground">
            Benchmark
          </h3>
        </div>
        <p className="font-mono text-[11px] italic text-muted-foreground/60">
          Sin comparación
        </p>
      </section>
    );
  }

  if (!benchmark.disponible) {
    return (
      <section
        className="border-b border-border/60 px-8 py-8"
        aria-label="Benchmark de pares"
      >
        <div className="mb-4">
          <h3 className="font-serif text-base font-normal text-foreground">
            Benchmark
          </h3>
        </div>
        <p className="font-mono text-[11px] italic text-muted-foreground/60">
          Sin comparación
        </p>
      </section>
    );
  }

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Benchmark de pares"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-base font-normal text-foreground">
            Benchmark
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            Pares en {benchmark.zona} · {benchmark.n}
          </p>
        </div>
        <div
          className="flex gap-1 rounded-md border border-border/60 p-1"
          role="group"
          aria-label="Cohorte de comparación"
        >
          {COHORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCohortBy(opt.value)}
              className={[
                "rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors",
                cohortBy === opt.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              aria-pressed={cohortBy === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICAS.map((config) => (
          <MetricaPanel
            key={config.key}
            config={config}
            metrica={benchmark[config.key]}
          />
        ))}
      </div>
    </section>
  );
}
