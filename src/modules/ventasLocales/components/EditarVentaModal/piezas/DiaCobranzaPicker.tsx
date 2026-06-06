import { cn } from "@/lib/utils";
import type { FinancieroFormData } from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiaCobranzaPickerProps {
  frecPago: FinancieroFormData["frecPago"];
  diaSemana: FinancieroFormData["diaCobranzaSemana"];
  diaMes: number;
  error?: string;
  onSemanaChange: (next: FinancieroFormData["diaCobranzaSemana"]) => void;
  onMesChange: (next: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA: Array<{
  value: FinancieroFormData["diaCobranzaSemana"];
  label: string;
}> = [
  { value: "LUNES", label: "Lun" },
  { value: "MARTES", label: "Mar" },
  { value: "MIERCOLES", label: "Mié" },
  { value: "JUEVES", label: "Jue" },
  { value: "VIERNES", label: "Vie" },
  { value: "SABADO", label: "Sáb" },
  { value: "DOMINGO", label: "Dom" },
];

const DIAS_MES = Array.from({ length: 31 }, (_, i) => i + 1);

// ─── Component ────────────────────────────────────────────────────────────────

export const DiaCobranzaPicker = ({
  frecPago,
  diaSemana,
  diaMes,
  error,
  onSemanaChange,
  onMesChange,
}: DiaCobranzaPickerProps) => {
  if (frecPago === "") return null;

  const helperText =
    frecPago === "SEMANAL"
      ? "Día de la semana"
      : "Día del mes (1–31)";

  return (
    <div className="space-y-2">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Día de cobranza
        </p>
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      </div>

      {frecPago === "SEMANAL" ? (
        <div className="flex flex-wrap gap-1.5">
          {DIAS_SEMANA.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onSemanaChange(value === diaSemana ? "" : value)}
              className={cn(
                "inline-flex items-center justify-center h-8 px-3 rounded-full border border-border/60 text-[11px] font-medium uppercase tracking-wider transition-colors",
                diaSemana === value
                  ? "bg-foreground text-background border-foreground"
                  : "hover:bg-muted/40",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
          {DIAS_MES.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onMesChange(day === diaMes ? 0 : day)}
              className={cn(
                "inline-flex items-center justify-center h-8 rounded-md border border-border/60 text-xs font-mono tabular transition-colors hover:bg-muted/40",
                diaMes === day
                  ? "bg-foreground text-background border-foreground"
                  : "",
              )}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-destructive">{error}</p>
      )}
    </div>
  );
};
