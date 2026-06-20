import { cn } from "@/lib/utils";
import { formatMoney } from "../lib/format";
import type { ResumenFicha } from "../../domain/entities/FichaCliente";

interface KpiCellProps {
  label: string;
  value: string;
}

// All values share one font (serif tabular-nums) so their baselines line up
// across columns — mixing serif money with mono counts left them visibly
// misaligned at the same size.
function KpiCell({ label, value }: KpiCellProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 px-6 py-5 text-center">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="font-serif tabular-nums text-[22px] font-normal leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}

interface Props {
  resumen: ResumenFicha;
  isLoading?: boolean;
}

export function FichaKpis({ resumen, isLoading = false }: Props) {
  const kpis: KpiCellProps[] = [
    { label: "Total comprado", value: formatMoney(resumen.totalComprado) },
    { label: "Total abonado", value: formatMoney(resumen.totalAbonado) },
    { label: "# ventas", value: String(resumen.numVentas) },
    { label: "# pagos", value: String(resumen.numPagos) },
    { label: "Ticket promedio", value: formatMoney(resumen.ticketPromedio) },
  ];

  return (
    <div className={cn("border-b border-border/60 px-8", isLoading && "opacity-50 transition-opacity")}>
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
