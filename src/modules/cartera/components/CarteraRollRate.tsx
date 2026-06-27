import { cn } from "@/lib/utils";
import type { RollRate } from "../domain/entities";
import { formatSignedPct } from "./lib/format";

// CarteraRollRate renders the deterioration panel (expanded view of DeterioroChip).
// When fewer than two snapshot cuts exist, the backend returns disponible:false
// and both dates are null → show "Acumulando datos".

function formatFecha(d: Date): string {
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function CarteraRollRate({
  rollRate,
  isLoading = false,
}: {
  rollRate: RollRate | null;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-md bg-muted" />;
  }

  if (rollRate === null || !rollRate.disponible) {
    return (
      <div className="flex items-center gap-2 py-4">
        <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50" />
        <p className="font-mono text-[13px] text-muted-foreground">Acumulando datos</p>
      </div>
    );
  }

  const value = rollRate.rollRate;
  const deterioro = value > 0;
  const mejora = value < 0;

  const tone = deterioro
    ? {
        text: "text-red-500",
        arrow: "▲",
        label: "Deterioro",
      }
    : mejora
      ? {
          text: "text-emerald-500",
          arrow: "▼",
          label: "Mejora",
        }
      : {
          text: "text-muted-foreground",
          arrow: "•",
          label: "Estable",
        };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className={cn("font-mono text-2xl tabular-nums font-semibold", tone.text)}>
          {tone.arrow} {formatSignedPct(value)}
        </span>
        <span className={cn("font-mono text-sm", tone.text)}>{tone.label}</span>
      </div>

      <div className="space-y-1">
        {rollRate.fechaCorteAnterior && (
          <p className="font-mono text-[11px] text-muted-foreground">
            Corte anterior:{" "}
            <span className="text-foreground">{formatFecha(rollRate.fechaCorteAnterior)}</span>
          </p>
        )}
        {rollRate.fechaCorteReciente && (
          <p className="font-mono text-[11px] text-muted-foreground">
            Corte reciente:{" "}
            <span className="text-foreground">{formatFecha(rollRate.fechaCorteReciente)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
