import { cn } from "@/lib/utils";
import type { RollRate } from "../domain/entities";
import { formatSignedPct } from "./lib/format";

// Compact deterioration indicator driven by /roll-rate. The backend exposes a
// single signed scalar in [-1,+1] comparing the two most recent snapshot cuts
// (positive = deterioro, negative = mejora). With fewer than two cuts the
// signal is `disponible:false` → "Acumulando datos". The richer roll-rate +
// cosechas visualization belongs to task F4.
export function DeterioroChip({ rollRate }: { rollRate: RollRate }) {
  if (!rollRate.disponible) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
        Acumulando datos
      </span>
    );
  }

  const value = rollRate.rollRate;
  const deterioro = value > 0;
  const mejora = value < 0;
  const tone = deterioro
    ? { text: "text-red-500", border: "border-red-500/20", bg: "bg-red-500/10", dot: "bg-red-500", arrow: "▲", label: "Deterioro" }
    : mejora
      ? { text: "text-emerald-500", border: "border-emerald-500/20", bg: "bg-emerald-500/10", dot: "bg-emerald-500", arrow: "▼", label: "Mejora" }
      : { text: "text-muted-foreground", border: "border-border/60", bg: "bg-muted/40", dot: "bg-muted-foreground/50", arrow: "•", label: "Estable" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px]",
        tone.bg,
        tone.border,
        tone.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
      {tone.arrow} {tone.label} · {formatSignedPct(value)}
    </span>
  );
}
