import dayjs from "dayjs";
import type { VentaDetalle } from "../../domain/entities";

const fmtMXN = (raw: string): string => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

interface Props {
  detalle: VentaDetalle;
}

export function VentaModalHero({ detalle }: Props) {
  const { venta } = detalle;
  const fecha = dayjs(venta.fecha).format("DD MMM YYYY · HH:mm");

  return (
    <header className="px-8 pt-10 pb-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {fecha}
          </p>
          <h2 className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
            {venta.folio}
          </h2>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {venta.tipo === "CONTADO" ? "Contado" : "Crédito"}
          </p>
        </div>

        <div className="flex gap-8 sm:gap-12 text-right sm:min-w-[340px] sm:justify-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Total
            </p>
            <p className="tabular-nums font-serif text-[44px] font-normal leading-none text-foreground">
              {fmtMXN(venta.total)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Saldo
            </p>
            <p className="tabular-nums font-serif text-[44px] font-normal leading-none text-foreground">
              {fmtMXN(venta.saldoVenta)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-5 font-mono text-[12px] tabular-nums text-muted-foreground">
        <span className="inline-flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Pagos
          </span>
          <span className="text-foreground">{venta.numPagos}</span>
        </span>
      </div>
    </header>
  );
}

export default VentaModalHero;
