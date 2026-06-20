import { ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import type { Pago } from "../../domain/entities";
import { categoriaMeta } from "../lib/pagoConcepto";
import type { CategoriaPago } from "../../domain/values/CategoriaPago";
import { formatMoney } from "../lib/format";

const LEGEND_CATEGORIAS: CategoriaPago[] = ["pago", "enganche", "condonacion", "perdida"];

interface Props {
  pagos: Pago[];
  onPagoClick?: (doctoCcId: number) => void;
}

export function VentaPagosList({ pagos, onPagoClick }: Props) {
  if (pagos.length === 0) {
    return (
      <section>
        <h3 className="mb-3 font-serif text-lg font-normal text-foreground">
          Pagos
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          Sin pagos registrados
        </p>
      </section>
    );
  }

  const sorted = [...pagos].sort(
    (a, b) => a.fecha.getTime() - b.fecha.getTime(),
  );

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-lg font-normal text-foreground">
          Pagos
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          {pagos.length} pago{pagos.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60 divide-y divide-border/60">
        {sorted.map((pago) => {
          const meta = categoriaMeta(pago.categoria);
          const isClickable = Boolean(onPagoClick);
          return (
            <button
              key={pago.doctoCcId}
              type="button"
              disabled={!isClickable}
              onClick={isClickable ? () => onPagoClick!(pago.doctoCcId) : undefined}
              className={cn(
                "flex w-full items-center justify-between px-4 py-3 text-left",
                meta.accentClass,
                isClickable && "cursor-pointer hover:bg-muted/40 group",
                !isClickable && "cursor-default",
              )}
            >
              <div className="flex flex-col gap-1 min-w-0">
                {/* Top line: date + concepto badge */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {dayjs(pago.fecha).format("DD MMM YYYY")}
                  </span>
                  <span className={meta.badgeClass}>
                    {pago.concepto}
                  </span>
                </div>
                {/* Second line: formaCobro · cobrador */}
                {(pago.formaCobro || pago.cobrador) && (
                  <p className="font-mono text-[11px] text-muted-foreground/70 truncate">
                    {[pago.formaCobro, pago.cobrador].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-4">
                <p className="tabular-nums font-mono text-sm font-medium text-foreground">
                  {formatMoney(pago.importe)}
                </p>
                {isClickable && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {LEGEND_CATEGORIAS.map((cat) => {
          const m = categoriaMeta(cat);
          return (
            <span key={cat} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full shrink-0", m.dotClass)} />
              <span className="font-mono text-[10px] text-muted-foreground">
                {m.label}
              </span>
            </span>
          );
        })}
      </div>
    </section>
  );
}

export default VentaPagosList;
