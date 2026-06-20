import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatMoney } from "../lib/format";
import { categoriaMeta } from "../lib/pagoConcepto";
import type { CategoriaPago } from "../../domain/values/CategoriaPago";
import type { PuntoCompradoAbonado } from "../../domain/entities/FichaCliente";
import {
  buildCompradoAbonadoSpine,
  type SpinePoint,
} from "./lib/compradoAbonadoSpine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CHART_HEIGHT = 240;
const AXIS_STYLE = {
  fontSize: 10,
  fontFamily: "var(--font-mono, ui-monospace)",
  fill: "hsl(var(--muted-foreground))",
};

// "Comprado" is no longer a bar — it is a marker drawn above its month so the
// large, sporadic purchase amounts never crush the small, steady abonos. The
// marker uses the neutral muted token; the abono stack carries all the color.
const COLOR_COMPRADO = "hsl(var(--muted-foreground))";

// Compact MXN for the purchase marker label (e.g. "$1.2 M"), kept short so the
// ▲ tags stay legible above the bars.
const COMPACT_MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  notation: "compact",
  maximumFractionDigits: 1,
});

// The abono stack, bottom-to-top. Each segment maps to a CategoriaPago so it
// reuses the exact heatmap color via categoriaMeta. Income (cobranza, enganche)
// sits at the bottom; non-income (condonación, pérdida) on top.
type StackSegment = {
  key: "cobranza" | "enganche" | "otro" | "condonacion" | "perdida";
  cat: CategoriaPago;
  label: string;
};

const STACK: StackSegment[] = [
  { key: "cobranza", cat: "pago", label: "Cobranza" },
  { key: "enganche", cat: "enganche", label: "Enganche" },
  { key: "otro", cat: "otro", label: "Otro" },
  { key: "condonacion", cat: "condonacion", label: "Condonación" },
  { key: "perdida", cat: "perdida", label: "Mal cliente/fuga" },
];

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

// LegendMarker is the legend entry for the purchase marker (▲ above the month).
function LegendMarker({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
      <span className="shrink-0 text-[10px]" style={{ color: COLOR_COMPRADO }}>
        ▲
      </span>
      {label}
    </span>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload?: SpinePoint }[];
}

function ChartTooltip({ active, payload }: CustomTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const rows = STACK.map((s) => ({ ...s, value: point[s.key] })).filter(
    (r) => r.value > 0,
  );
  return (
    <div className="rounded-md border border-border/60 bg-background px-3 py-2 shadow-lg">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {point.label}
      </p>
      {point.comprado > 0 && (
        <p
          className="font-mono text-xs tabular-nums"
          style={{ color: COLOR_COMPRADO }}
        >
          Compra: {formatMoney(String(point.comprado))}
        </p>
      )}
      {rows.map((r) => (
        <p
          key={r.key}
          className="font-mono text-xs tabular-nums"
          style={{ color: categoriaMeta(r.cat).color }}
        >
          {r.label}: {formatMoney(String(r.value))}
        </p>
      ))}
      <p className="mt-1 border-t border-border/40 pt-1 font-mono text-xs tabular-nums text-foreground">
        Abonado: {formatMoney(String(point.abonadoTotal))}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comprado vs Abonado chart
// ---------------------------------------------------------------------------

interface CompradoAbonadoChartProps {
  data: PuntoCompradoAbonado[];
}

function CompradoAbonadoChart({ data }: CompradoAbonadoChartProps) {
  const spine = buildCompradoAbonadoSpine(data, new Date());

  const allZero = spine.every(
    (p) => p.comprado === 0 && p.abonadoTotal === 0,
  );
  if (allZero) {
    return (
      <div className="flex h-[240px] items-center justify-center">
        <p className="font-mono text-[11px] text-muted-foreground/60">
          Sin datos suficientes
        </p>
      </div>
    );
  }

  const compras = spine.filter((p) => p.comprado > 0);

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={spine} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
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
          interval="preserveStartEnd"
          minTickGap={12}
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
        <Tooltip content={<ChartTooltip />} cursor={{ opacity: 0.08 }} />
        {STACK.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId="ab"
            fill={categoriaMeta(s.cat).color}
            maxBarSize={22}
            radius={i === STACK.length - 1 ? [3, 3, 0, 0] : undefined}
          />
        ))}
        {compras.map((p) => (
          <ReferenceLine
            key={`compra-${p.anio}-${p.mes}`}
            x={p.label}
            stroke={COLOR_COMPRADO}
            strokeDasharray="2 3"
            strokeOpacity={0.35}
            label={{
              value: `▲ ${COMPACT_MXN.format(p.comprado)}`,
              position: "top",
              fill: COLOR_COMPRADO,
              fontSize: 9,
              fontFamily: "var(--font-mono, ui-monospace)",
            }}
          />
        ))}
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
  compradoVsAbonado: PuntoCompradoAbonado[];
  isLoading?: boolean;
}

export function FichaCharts({ compradoVsAbonado, isLoading = false }: Props) {
  return (
    <section
      className={`border-b border-border/60 px-8 py-8${isLoading ? " opacity-50 transition-opacity" : ""}`}
      aria-label="Gráficas de actividad"
    >
      <ChartSection
        title="Comprado vs abonado"
        caption="abonos por concepto · 24 meses"
        legend={
          <>
            {STACK.map((s) => (
              <LegendDot
                key={s.key}
                color={categoriaMeta(s.cat).color}
                label={s.label}
              />
            ))}
            <LegendMarker label="Compra" />
          </>
        }
      >
        <CompradoAbonadoChart data={compradoVsAbonado} />
      </ChartSection>
    </section>
  );
}
