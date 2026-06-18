import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatMoney } from "../lib/format";
import type {
  PuntoMensual,
  PuntoCompradoAbonado,
} from "../../domain/entities/FichaCliente";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function monthLabel(anio: number, mes: number): string {
  const name = MONTH_NAMES[(mes - 1) % 12] ?? String(mes);
  return `${name} ${String(anio).slice(-2)}`;
}

const CHART_HEIGHT = 240;
const AXIS_STYLE = {
  fontSize: 10,
  fontFamily: "var(--font-mono, ui-monospace)",
  fill: "hsl(var(--muted-foreground))",
};

// Series colors. Green = money in (abonos), consistent with the app's green
// semantics; readable on both light and dark themes (green-600 ≥ 3:1 on each).
// "Comprado" uses the neutral muted token so the accent stays reserved for abonos.
const COLOR_ABONADO = "#16a34a";
const COLOR_COMPRADO = "hsl(var(--muted-foreground))";

// LegendDot is a single colored-dot + label entry for an inline chart legend.
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

interface TooltipPayloadEntry {
  name?: string | number;
  value?: number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltipMXN({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border/60 bg-background px-3 py-2 shadow-lg">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {payload.map((entry, i) => (
        <p
          key={i}
          className="font-mono text-xs tabular-nums"
          style={{ color: entry.color }}
        >
          {entry.name}: {formatMoney(String(entry.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Abonos por mes chart
// ---------------------------------------------------------------------------

interface AbonosChartProps {
  data: PuntoMensual[];
}

function AbonosChart({ data }: AbonosChartProps) {
  const chartData = data.map((d) => ({
    label: monthLabel(d.anio, d.mes),
    monto: Number(d.monto),
  }));

  if (chartData.length < 2) {
    return (
      <div className="flex h-[240px] items-center justify-center">
        <p className="font-mono text-[11px] text-muted-foreground/60">
          Sin datos suficientes
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
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
          tickFormatter={(v: number) =>
            new Intl.NumberFormat("es-MX", {
              notation: "compact",
              maximumFractionDigits: 0,
            }).format(v)
          }
        />
        <Tooltip content={<CustomTooltipMXN />} cursor={{ opacity: 0.08 }} />
        <Bar
          dataKey="monto"
          name="Abonado"
          fill={COLOR_ABONADO}
          radius={[3, 3, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Comprado vs Abonado chart
// ---------------------------------------------------------------------------

interface CompradoAbonadoChartProps {
  data: PuntoCompradoAbonado[];
}

function CompradoAbonadoChart({ data }: CompradoAbonadoChartProps) {
  const chartData = data.map((d) => ({
    label: monthLabel(d.anio, d.mes),
    comprado: Number(d.comprado),
    abonado: Number(d.abonado),
  }));

  if (chartData.length < 2) {
    return (
      <div className="flex h-[240px] items-center justify-center">
        <p className="font-mono text-[11px] text-muted-foreground/60">
          Sin datos suficientes
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
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
          tickFormatter={(v: number) =>
            new Intl.NumberFormat("es-MX", {
              notation: "compact",
              maximumFractionDigits: 0,
            }).format(v)
          }
        />
        <Tooltip content={<CustomTooltipMXN />} cursor={{ opacity: 0.08 }} />
        <Bar
          dataKey="comprado"
          name="Comprado"
          fill={COLOR_COMPRADO}
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
        <Bar
          dataKey="abonado"
          name="Abonado"
          fill={COLOR_ABONADO}
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

interface ChartSectionProps {
  title: string;
  caption: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
}

function ChartSection({ title, caption, legend, children }: ChartSectionProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-base font-normal text-foreground">
            {title}
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            {caption}
          </p>
        </div>
        {legend && (
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 pt-1">
            {legend}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface Props {
  abonosPorMes: PuntoMensual[];
  compradoVsAbonado: PuntoCompradoAbonado[];
  isLoading?: boolean;
}

export function FichaCharts({ abonosPorMes, compradoVsAbonado, isLoading = false }: Props) {
  return (
    <section
      className={`border-b border-border/60 px-8 py-8${isLoading ? " opacity-50 transition-opacity" : ""}`}
      aria-label="Gráficas de actividad"
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <ChartSection
          title="Abonos por mes"
          caption="historial de pagos"
          legend={<LegendDot color={COLOR_ABONADO} label="Abonado" />}
        >
          <AbonosChart data={abonosPorMes} />
        </ChartSection>
        <ChartSection
          title="Comprado vs abonado"
          caption="comparativa mensual"
          legend={
            <>
              <LegendDot color={COLOR_COMPRADO} label="Comprado" />
              <LegendDot color={COLOR_ABONADO} label="Abonado" />
            </>
          }
        >
          <CompradoAbonadoChart data={compradoVsAbonado} />
        </ChartSection>
      </div>
    </section>
  );
}
