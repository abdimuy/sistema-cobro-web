import { formatMoney, formatPct } from "../lib/format";
import type { ResumenFicha } from "../../domain/entities/FichaCliente";

// ─── FichaLiquidacionBar ───────────────────────────────────────────────────────

interface Props {
  resumen: ResumenFicha;
}

export function FichaLiquidacionBar({ resumen }: Props) {
  const { totalComprado, totalAbonado, saldo, pctLiquidado } = resumen;

  // Guard: no sales history → render nothing
  const compradoNum = Number(totalComprado);
  if (!Number.isFinite(compradoNum) || compradoNum === 0) return null;

  // Clamp pct to [0, 100]
  const rawPct = Number(pctLiquidado);
  const pct = Number.isFinite(rawPct)
    ? Math.min(100, Math.max(0, rawPct))
    : 0;

  const pctLabel = formatPct(String(pct));

  return (
    <section className="border-b border-border/60 px-8 py-8">
    <div className="flex flex-col gap-2 max-w-lg" aria-label="Liquidación de la cuenta">
      {/* Header: label + percentage */}
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
          Liquidación de la cuenta
        </span>
        <span className="font-mono text-xs tabular-nums text-foreground">
          {pctLabel}
        </span>
      </div>

      {/* Track + fill */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Liquidación: ${pctLabel}`}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-green-600 dark:bg-green-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer: paid / balance / total */}
      <div className="flex justify-between font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
        <span>pagado {formatMoney(totalAbonado)}</span>
        <span>
          saldo {formatMoney(saldo)} de {formatMoney(totalComprado)}
        </span>
      </div>
    </div>
    </section>
  );
}
