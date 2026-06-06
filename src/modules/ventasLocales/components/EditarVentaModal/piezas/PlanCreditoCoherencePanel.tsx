import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanCreditoCoherencePanelProps {
  anualRaw: string;
  engancheRaw: string;
  parcialidadRaw: string;
  plazoMeses: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (n: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

// ─── Component ────────────────────────────────────────────────────────────────

export const PlanCreditoCoherencePanel = ({
  anualRaw,
  engancheRaw,
  parcialidadRaw,
  plazoMeses,
}: PlanCreditoCoherencePanelProps) => {
  const anual = parseFloat(anualRaw) || 0;
  const enganche = parseFloat(engancheRaw) || 0;
  const parcialidad = parseFloat(parcialidadRaw) || 0;

  const isUnavailable = plazoMeses === 0 || anual === 0;

  const totalPlanCredito = enganche + parcialidad * plazoMeses;
  const delta = totalPlanCredito - anual;
  const pct = anual > 0 ? (delta / anual) * 100 : 0;
  const hasVariance = Math.abs(pct) > 5;

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 space-y-2 font-mono text-[12px] tabular-nums">
      {isUnavailable ? (
        <p className="text-center text-muted-foreground">
          Cálculo no disponible (faltan datos)
        </p>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Enganche + Parcialidad × Plazo
            </span>
            <span className="font-medium">{fmtMoney(totalPlanCredito)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Precio anual</span>
            <span className="font-medium">{fmtMoney(anual)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Diferencia</span>
            {hasVariance ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full bg-chart-4/15 px-2 py-0.5",
                  "text-[10px] font-medium uppercase tracking-wider text-chart-4",
                )}
              >
                {delta >= 0 ? "+" : ""}
                {fmtMoney(delta)} ({pct >= 0 ? "+" : ""}
                {pct.toFixed(1)}%)
              </span>
            ) : (
              <span className="text-muted-foreground">
                {delta >= 0 ? "+" : ""}
                {fmtMoney(delta)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
