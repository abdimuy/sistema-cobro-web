import { cn } from "@/lib/utils";

interface Props {
  filled: number;
  total: number;
}

// MapeoMeter is the signature visual of Configuración: a fixed-width row of
// `total` pips, `filled` of them solid. It never wraps (whitespace-nowrap +
// shrink-0), so it can sit inside a fixed-height worklist row regardless of
// how many/few slots are assigned. Color communicates state at a glance:
// emerald when fully mapped, amber when partially mapped, muted when empty.
export function MapeoMeter({ filled, total }: Props) {
  const clamped = Math.max(0, Math.min(filled, total));
  const tone =
    clamped === total && total > 0
      ? "text-emerald-500"
      : clamped > 0
        ? "text-amber-500"
        : "text-muted-foreground/40";

  return (
    <div
      role="img"
      aria-label={`${clamped} de ${total} asignados`}
      className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap font-mono"
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn("text-[13px] leading-none", i < clamped ? tone : "text-muted-foreground/25")}
        >
          {i < clamped ? "▮" : "▯"}
        </span>
      ))}
    </div>
  );
}
