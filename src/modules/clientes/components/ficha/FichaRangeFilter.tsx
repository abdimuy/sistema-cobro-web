import { useId } from "react";
import { cn } from "@/lib/utils";
import type { FichaDateRange } from "../../application/ports/ClientesPort";

interface Props {
  range: FichaDateRange;
  isLoading?: boolean;
  onChange: (range: FichaDateRange) => void;
  onClear: () => void;
}

// FichaRangeFilter renders compact date-range inputs for filtering KPIs and
// charts. Validates desde<=hasta on the client; shows an inline hint when
// inverted. Changing either input triggers onChange immediately.
export function FichaRangeFilter({
  range,
  isLoading = false,
  onChange,
  onClear,
}: Props) {
  const desdeId = useId();
  const hastaId = useId();

  const { desde = "", hasta = "" } = range;
  const inverted = desde !== "" && hasta !== "" && desde > hasta;
  const hasRange = desde !== "" || hasta !== "";

  function handleDesde(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...range, desde: e.target.value || undefined });
  }

  function handleHasta(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...range, hasta: e.target.value || undefined });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label
          htmlFor={desdeId}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground"
        >
          Desde
        </label>
        <input
          id={desdeId}
          type="date"
          value={desde}
          max={hasta || undefined}
          onChange={handleDesde}
          disabled={isLoading}
          className={cn(
            "h-7 rounded-md border border-border/60 bg-background px-2",
            "font-mono text-[11px] text-foreground tabular-nums",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:opacity-50",
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor={hastaId}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground"
        >
          Hasta
        </label>
        <input
          id={hastaId}
          type="date"
          value={hasta}
          min={desde || undefined}
          onChange={handleHasta}
          disabled={isLoading}
          className={cn(
            "h-7 rounded-md border border-border/60 bg-background px-2",
            "font-mono text-[11px] text-foreground tabular-nums",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:opacity-50",
            inverted && "border-destructive/60 focus:ring-destructive",
          )}
        />
      </div>

      {inverted && (
        <span className="font-mono text-[10px] text-destructive">
          fecha inicial mayor que final
        </span>
      )}

      {hasRange && !inverted && (
        <button
          type="button"
          onClick={onClear}
          disabled={isLoading}
          className={cn(
            "font-mono text-[10px] text-muted-foreground underline-offset-2",
            "hover:text-foreground hover:underline",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
