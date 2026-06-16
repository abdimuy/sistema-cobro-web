import { cn } from "@/lib/utils";
import { formatMoney, formatPct } from "../lib/format";
import type { ResumenFicha } from "../../domain/entities/FichaCliente";

interface KpiCellProps {
  label: string;
  value: string;
  mono?: boolean;
}

function KpiCell({ label, value, mono = false }: KpiCellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-6 py-5 first:pl-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "tabular-nums text-[22px] font-normal leading-none text-foreground",
          mono ? "font-mono" : "font-serif",
        )}
      >
        {value}
      </p>
    </div>
  );
}

interface Props {
  resumen: ResumenFicha;
}

export function FichaKpis({ resumen }: Props) {
  const kpis: KpiCellProps[] = [
    { label: "Total comprado", value: formatMoney(resumen.totalComprado) },
    { label: "Total abonado", value: formatMoney(resumen.totalAbonado) },
    {
      label: "% liquidado",
      value: formatPct(resumen.pctLiquidado),
      mono: true,
    },
    { label: "# ventas", value: String(resumen.numVentas), mono: true },
    { label: "# pagos", value: String(resumen.numPagos), mono: true },
    { label: "Ticket promedio", value: formatMoney(resumen.ticketPromedio) },
  ];

  return (
    <div className="border-b border-border/60 px-8">
      <div className="flex flex-wrap">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={cn(
              "flex-1 min-w-[140px]",
              i > 0 && "border-l border-border/40",
            )}
          >
            <KpiCell {...kpi} />
          </div>
        ))}
      </div>
    </div>
  );
}
