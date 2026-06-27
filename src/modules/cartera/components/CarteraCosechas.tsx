import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Cosecha } from "../domain/entities";
import { formatMoney } from "./lib/format";
import { cohortMonthToLabel } from "./lib/cohortMonthToLabel";

// NOTE: full cohort×age triangle deferred until snapshot history accumulates (≥2 cuts needed)

const CHART_HEIGHT = 220;
const AXIS_STYLE = {
  fontSize: 10,
  fontFamily: "var(--font-mono, ui-monospace)",
  fill: "hsl(var(--muted-foreground))",
};

const COMPACT_MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  notation: "compact",
  maximumFractionDigits: 1,
});

type ChartRow = {
  label: string;
  saldo: number;
  conteo: number;
};

interface TooltipProps {
  active?: boolean;
  payload?: { value?: number; payload?: ChartRow }[];
}

function CosechasTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-md border border-border/60 bg-background px-3 py-2 shadow-lg">
      <p className="font-mono text-xs font-medium text-foreground">{row.label}</p>
      <p className="font-mono text-xs tabular-nums text-foreground">
        {formatMoney(String(row.saldo))}
      </p>
      <p className="font-mono text-xs text-muted-foreground">{row.conteo} ctas</p>
    </div>
  );
}

export function CarteraCosechas({
  cosechas,
  isLoading = false,
}: {
  cosechas: Cosecha[];
  isLoading?: boolean;
}) {
  if (cosechas.length === 0) {
    if (isLoading) {
      return <div className="h-48 animate-pulse rounded-md bg-muted" />;
    }
    return (
      <p className="font-mono text-[11px] text-muted-foreground">Sin datos</p>
    );
  }

  const sorted = [...cosechas].sort((a, b) => a.cohortMonth - b.cohortMonth);

  const data: ChartRow[] = sorted.map((c) => ({
    label: cohortMonthToLabel(c.cohortMonth),
    saldo: Number(c.saldo),
    conteo: c.conteo,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v: number) => COMPACT_MXN.format(v)}
          />
          <Tooltip content={<CosechasTooltip />} cursor={{ opacity: 0.08 }} />
          <Bar
            dataKey="saldo"
            name="Saldo"
            fill="hsl(var(--primary))"
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
      {/* Accessible summary for screen readers and tests */}
      <ul className="sr-only" aria-label="Cosechas por cohorte">
        {data.map((row) => (
          <li key={row.label}>
            {row.label}: {formatMoney(String(row.saldo))} · {row.conteo} ctas
          </li>
        ))}
      </ul>
    </div>
  );
}
