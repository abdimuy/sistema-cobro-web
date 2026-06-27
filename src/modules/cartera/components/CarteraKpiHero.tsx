import { cn } from "@/lib/utils";
import type { SaludCartera } from "../domain/entities";
import { formatMoney, formatRatioPct } from "./lib/format";
import {
  ceiLevel,
  parLevel,
  semaphoreTone,
  type SemaphoreLevel,
} from "./lib/carteraUx";

type Kpi = {
  label: string;
  value: string;
  level: SemaphoreLevel;
};

// One KPI cell: mono label + serif value, with an optional semáforo dot.
// Visual language mirrors clientes/ficha KpiCell so the dashboard reads as one.
function KpiCell({ label, value, level }: Kpi) {
  const tone = semaphoreTone(level);
  const showDot = level !== "neutral";
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 px-6 py-5 text-center">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "flex items-center gap-1.5 font-serif tabular-nums text-[22px] font-normal leading-none",
          showDot ? tone.text : "text-foreground",
        )}
      >
        {showDot && (
          <span
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)}
            data-testid={`kpi-dot-${level}`}
          />
        )}
        {value}
      </p>
    </div>
  );
}

export function CarteraKpiHero({
  salud,
  isLoading = false,
}: {
  salud: SaludCartera;
  isLoading?: boolean;
}) {
  const kpis: Kpi[] = [
    { label: "PAR", value: formatRatioPct(salud.par), level: parLevel(salud.par) },
    {
      label: "Tasa de cobranza",
      value: formatRatioPct(salud.ceiRate),
      level: ceiLevel(salud.ceiRate),
    },
    { label: "Saldo total", value: formatMoney(salud.saldoTotal), level: "neutral" },
    {
      label: "Cuentas en mora",
      value: String(salud.cuentasEnMora),
      level: salud.cuentasEnMora > 0 ? "amber" : "green",
    },
    {
      label: "Margen real",
      value: formatRatioPct(salud.margenRealProxy),
      level: "neutral",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-md border border-border/60",
        isLoading && "opacity-50 transition-opacity",
      )}
    >
      <div className="flex flex-wrap">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={cn("flex-1 min-w-[140px]", i > 0 && "border-l border-border/40")}
          >
            <KpiCell {...kpi} />
          </div>
        ))}
      </div>
    </div>
  );
}
