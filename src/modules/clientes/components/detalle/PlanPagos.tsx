import dayjs from "dayjs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { VentaDetalle } from "../../domain/entities";
import { calcularPlanPagos } from "../../domain/planPagos";
import { formatMoney } from "../lib/format";

interface Props {
  detalle: VentaDetalle;
}

// PlanPagos shows the forward-looking payoff projection only — progress bar,
// next installment, what's left and the estimated payoff date. The contract
// terms (parcialidad/plazo/enganche), the actual payments list and the rhythm
// heatmap already live elsewhere in the modal, so a full reconstructed schedule
// here is redundant; this mirrors how lending/BNPL dashboards (Affirm, Klarna)
// surface "progress + next payment" instead of an amortization table.
export function PlanPagos({ detalle }: Props) {
  const plan = calcularPlanPagos(detalle);
  if (plan === null) return null;

  const { resumen, filas } = plan;
  const total = filas.length;
  const pagadas = filas.filter((f) => f.estado === "pagada").length;
  const faltan = total - pagadas;
  const actual = filas.find((f) => f.estado === "actual");
  const ultima = filas[filas.length - 1];

  const pagadoNum = Number(resumen.pagado);
  const totalNum = Number(resumen.total);
  const pct =
    totalNum > 0 ? Math.min(100, Math.round((pagadoNum / totalNum) * 100)) : 0;

  // Expected progress: the share that should be covered by today per the
  // schedule (sum of installments whose estimated date has passed). Shown as a
  // lighter bar behind the solid "paid" bar so the gap = how far behind.
  const hoyMs = Date.now();
  const esperadoNum = filas.reduce(
    (s, f) => (f.fechaEstimada.getTime() <= hoyMs ? s + Number(f.monto) : s),
    0,
  );
  const pctEsperado =
    totalNum > 0 ? Math.min(100, Math.round((esperadoNum / totalNum) * 100)) : 0;
  const esperadoStr = esperadoNum.toFixed(2);
  const brechaNum = esperadoNum - pagadoNum;
  const brecha =
    brechaNum > 0.01
      ? { texto: `Atrasado ${formatMoney(brechaNum.toFixed(2))}`, atrasado: true }
      : brechaNum < -0.01
        ? { texto: `Adelantado ${formatMoney((-brechaNum).toFixed(2))}`, atrasado: false }
        : { texto: "Al corriente", atrasado: false };

  return (
    <section>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-normal text-foreground">
            Plan de pagos
          </h3>
          <p className="font-mono text-[10px] text-muted-foreground">
            proyección estimada del contrato
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
            resumen.atrasado
              ? "bg-amber-500/10 text-amber-500"
              : "bg-green-500/10 text-green-600 dark:text-green-400",
          )}
        >
          {resumen.atrasado ? "Atrasado" : "Al corriente"}
        </span>
      </div>

      {/* Progress: solid bar = paid, lighter bar behind = expected by today */}
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">
          {pagadas} de {total} pagos
        </span>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {pct}% liquidado
        </span>
      </div>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              aria-label="Avance de pago"
              className="relative h-2 w-full overflow-hidden rounded-full bg-border/50"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-foreground/25"
                style={{ width: `${pctEsperado}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="space-y-0.5 font-mono text-[11px]">
              <p>
                Pagado {formatMoney(resumen.pagado)} ({pct}%)
              </p>
              <p className="text-primary-foreground/70">
                Debería llevar {formatMoney(esperadoStr)} ({pctEsperado}%)
              </p>
              <p className={brecha.atrasado ? "text-amber-400" : "text-green-400"}>
                {brecha.texto}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Money breakdown — what's paid vs what should be covered by today */}
      <div className="mt-3 grid grid-cols-2 gap-4">
        <LegendStat
          dotClass="bg-foreground"
          label="Pagado"
          value={formatMoney(resumen.pagado)}
        />
        <LegendStat
          dotClass="bg-foreground/25"
          label="Debería llevar a hoy"
          value={formatMoney(esperadoStr)}
        />
      </div>

      {/* Forward-looking stats */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <Stat
          label="Próximo pago"
          value={actual ? formatMoney(actual.monto) : "—"}
          sub={
            actual
              ? dayjs(actual.fechaEstimada).format("DD MMM YYYY")
              : "liquidada"
          }
        />
        <Stat
          label="Restante"
          value={formatMoney(resumen.saldo)}
          sub={faltan > 0 ? `${faltan} ${faltan === 1 ? "pago" : "pagos"}` : "—"}
        />
        <Stat
          label="Liquidación est."
          value={`≈ ${dayjs(ultima.fechaEstimada).format("MMM YYYY")}`}
          sub={`${resumen.numCuotas} ${resumen.cadenciaLabel}`}
        />
      </div>
    </section>
  );
}

function LegendStat({
  dotClass,
  label,
  value,
}: {
  dotClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotClass)} />
      <div>
        <dt className="font-mono text-[10px] text-muted-foreground">{label}</dt>
        <dd className="font-mono text-[14px] font-medium tabular-nums text-foreground">
          {value}
        </dd>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-[15px] font-medium tabular-nums text-foreground">
        {value}
      </dd>
      {sub && (
        <dd className="font-mono text-[10px] text-muted-foreground">{sub}</dd>
      )}
    </div>
  );
}

export default PlanPagos;
