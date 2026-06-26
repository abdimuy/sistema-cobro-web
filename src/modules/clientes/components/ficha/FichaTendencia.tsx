import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import type { PuntoMensual, Tendencia } from "../../domain/entities/FichaCliente";

// ─── Trend direction config ────────────────────────────────────────────────────

type TrendCfg = {
  arrow: string;
  label: string;
  colorClass: string;
  strokeColor: string;
};

const TREND_CONFIG: Record<Tendencia["direccion"], TrendCfg> = {
  mejorando: {
    arrow: "↑",
    label: "Mejorando",
    colorClass: "text-green-600 dark:text-green-400",
    strokeColor: "hsl(142, 71%, 45%)",
  },
  estable: {
    arrow: "→",
    label: "Estable",
    colorClass: "text-muted-foreground",
    strokeColor: "hsl(0, 0%, 60%)",
  },
  empeorando: {
    arrow: "↓",
    label: "Empeorando",
    colorClass: "text-red-600 dark:text-red-400",
    strokeColor: "hsl(0, 72%, 64%)",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  abonosPorMes: PuntoMensual[];
  tendencia: Tendencia;
  isLoading?: boolean;
}

type SparkPoint = { v: number };

export function FichaTendencia({ abonosPorMes, tendencia, isLoading = false }: Props) {
  const data: SparkPoint[] = abonosPorMes.map((p) => ({ v: parseFloat(p.monto) }));
  const cfg = TREND_CONFIG[tendencia.direccion];

  // Require at least 2 points for a meaningful sparkline
  if (data.length < 2) return null;

  return (
    <section
      className={cn(
        "border-b border-border/60 px-8 py-3",
        isLoading && "opacity-50 transition-opacity",
      )}
      aria-label="Tendencia de abonos"
    >
      <div className="flex items-center gap-8">
        {/* Tendency indicator */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
            Tendencia
          </p>
          <div className={cn("flex items-baseline gap-1", cfg.colorClass)}>
            <span className="text-base leading-none" aria-hidden="true">
              {cfg.arrow}
            </span>
            <span className="font-mono text-[11px]">{cfg.label}</span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="flex-1 min-w-0">
          <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
            Abonos / mes
          </p>
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={cfg.strokeColor}
                fill={cfg.strokeColor}
                fillOpacity={0.08}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
