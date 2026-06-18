import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import type { VentaDetalle } from "../../domain/entities";
import { calcularPlanPagos } from "../../domain/planPagos";
import type { FilaEstado } from "../../domain/planPagos";
import { formatMoney } from "../lib/format";

interface Props {
  detalle: VentaDetalle;
}

export function PlanPagos({ detalle }: Props) {
  const plan = calcularPlanPagos(detalle);
  if (plan === null) return null;

  const { resumen, filas } = plan;

  return (
    <section>
      <div className="mb-4">
        <h3 className="font-serif text-lg font-normal text-foreground">
          Plan de pagos
        </h3>
        <p className="font-mono text-[10px] text-muted-foreground">
          reconstruido del contrato · estimado
        </p>
      </div>

      {/* Summary strip */}
      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-4">
        <SummaryKpi label="total" value={formatMoney(resumen.total)} />
        <SummaryKpi label="enganche" value={formatMoney(resumen.enganche)} />
        <SummaryKpi label="parcialidad" value={formatMoney(resumen.parcialidad)} />
        <SummaryKpi label="plazo" value={`≈${resumen.numCuotas} sem`} />
        <SummaryKpi label="pagado" value={formatMoney(resumen.pagado)} />
        <SummaryKpi label="saldo" value={formatMoney(resumen.saldo)} />
        <div>
          <dt className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            estado
          </dt>
          <dd
            className={cn(
              "mt-1 font-mono text-[15px] font-medium tabular-nums",
              resumen.atrasado
                ? "text-amber-500"
                : "text-green-600 dark:text-green-400",
            )}
          >
            {resumen.atrasado ? "Atrasado" : "Al corriente"}
          </dd>
        </div>
      </div>

      {/* Schedule table */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-border/60">
        {filas.map((fila) => (
          <div
            key={fila.indice}
            className={cn(
              "grid items-center gap-3 px-3 py-2.5",
              "grid-cols-[20px_100px_1fr_auto]",
              "border-b border-border/40 last:border-b-0",
              fila.estado === "actual" && "bg-foreground/[0.04]",
            )}
          >
            <StatusDot estado={fila.estado} />
            <span className="font-mono text-[12px] text-foreground">
              {fila.label}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {dayjs(fila.fechaEstimada).format("DD MMM YYYY")}
            </span>
            <span className="tabular-nums font-mono text-[12px] font-medium text-foreground">
              {formatMoney(fila.monto)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryKpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-[15px] font-medium tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function StatusDot({ estado }: { estado: FilaEstado }) {
  return (
    <div
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px]",
        estado === "pagada" &&
          "bg-green-500/10 text-green-600 dark:text-green-400",
        estado === "actual" && "bg-foreground text-background",
        estado === "pendiente" && "border border-border",
      )}
    >
      {estado === "pagada" && "✓"}
      {estado === "actual" && "●"}
    </div>
  );
}

export default PlanPagos;
