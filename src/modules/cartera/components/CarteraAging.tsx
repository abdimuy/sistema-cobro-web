import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AgingBucket } from "../domain/entities";
import { formatMoney } from "./lib/format";
import { agingColor, AGING_BUCKET_ORDER } from "./lib/carteraUx";

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

type Row = { label: string } & Record<string, number | string>;

// Collapse the buckets into a single stacked column. Each bucket becomes a
// stack segment so the whole cartera is one bar split green→red by antigüedad.
function buildRow(buckets: AgingBucket[]): Row {
  const row: Row = { label: "Cartera" };
  for (const b of buckets) {
    row[b.bucket] = Number(b.saldo);
    row[`${b.bucket}__conteo`] = b.conteo;
  }
  return row;
}

interface TooltipProps {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; payload?: Row }[];
}

function AgingTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-md border border-border/60 bg-background px-3 py-2 shadow-lg">
      {AGING_BUCKET_ORDER.map((bucket) => {
        const saldo = row?.[bucket];
        if (typeof saldo !== "number" || saldo <= 0) return null;
        const conteo = row?.[`${bucket}__conteo`];
        return (
          <p
            key={bucket}
            className="flex items-center gap-1.5 font-mono text-xs tabular-nums"
            style={{ color: agingColor(bucket) }}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: agingColor(bucket) }}
            />
            {bucket}: {formatMoney(String(saldo))}
            {typeof conteo === "number" && (
              <span className="text-muted-foreground"> · {conteo} ctas</span>
            )}
          </p>
        );
      })}
    </div>
  );
}

export function CarteraAging({
  buckets,
  isLoading = false,
}: {
  buckets: AgingBucket[];
  isLoading?: boolean;
}) {
  if (buckets.length === 0) {
    if (isLoading) {
      return <div className="h-48 animate-pulse rounded-md bg-muted" />;
    }
    return (
      <p className="font-mono text-[11px] text-muted-foreground">Sin datos</p>
    );
  }

  const data = [buildRow(buckets)];
  const present = AGING_BUCKET_ORDER.filter((b) =>
    buckets.some((x) => x.bucket === b),
  );

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
          <Tooltip content={<AgingTooltip />} cursor={{ opacity: 0.08 }} />
          {present.map((bucket) => (
            <Bar
              key={bucket}
              stackId="aging"
              dataKey={bucket}
              name={bucket}
              fill={agingColor(bucket)}
              maxBarSize={64}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {present.map((bucket) => (
          <span
            key={bucket}
            className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: agingColor(bucket) }}
            />
            {bucket}
          </span>
        ))}
      </div>
    </div>
  );
}
