import dayjs from "dayjs";
import type { Pago } from "../../domain/entities";

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
  pagos: Pago[];
}

export function VentaPagosList({ pagos }: Props) {
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
        {sorted.map((pago) => (
          <div
            key={pago.doctoCcId}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-4">
              <p className="font-mono text-[12px] text-muted-foreground">
                {dayjs(pago.fecha).format("DD MMM YYYY")}
              </p>
              <p className="text-xs text-foreground">
                {pago.formaCobro}
              </p>
            </div>
            <p className="tabular-nums font-mono text-sm font-medium text-foreground">
              {fmtMXN(pago.importe)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default VentaPagosList;
