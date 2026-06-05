import dayjs from "dayjs";
import { VentaV2 } from "@/services/api/ventaV2Types";

interface Props {
  venta: VentaV2;
}

const fmt = (raw: string): string => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const fmtShort = (raw: string): string => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

const direccionResumen = (venta: VentaV2): string => {
  const parts = [
    venta.direccion.calle && venta.direccion.numero_exterior
      ? `${venta.direccion.calle} #${venta.direccion.numero_exterior}`
      : venta.direccion.calle,
    venta.direccion.colonia,
    venta.direccion.poblacion,
  ].filter(Boolean);
  return parts.join(", ");
};

export const VentaDetalleHero = ({ venta }: Props) => {
  const fecha = dayjs(venta.fecha_venta).format("DD MMM YYYY · HH:mm");
  const totalLabel = venta.tipo_venta === "CONTADO" ? "Precio contado" : "Precio anual";
  const totalRaw = venta.tipo_venta === "CONTADO" ? venta.montos.contado : venta.montos.anual;

  return (
    <header className="px-8 pt-10 pb-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 sm:max-w-[60%]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {fecha}
          </p>
          <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
            {venta.cliente.nombre}
          </h1>
          {(direccionResumen(venta) || venta.cliente.cliente_id == null) && (
            <p className="text-sm text-muted-foreground">
              {venta.cliente.cliente_id == null && (
                <span className="mr-2 inline-flex items-center rounded-full bg-chart-4/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-chart-4">
                  Cliente nuevo
                </span>
              )}
              {direccionResumen(venta)}
            </p>
          )}
        </div>
        <div className="text-right sm:min-w-[260px]">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {totalLabel}
          </p>
          <p className="tabular font-serif text-[52px] font-normal leading-none text-foreground">
            {fmt(totalRaw)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-5 font-mono text-[12px] tabular text-muted-foreground">
        <Item label="Contado" value={fmtShort(venta.montos.contado)} />
        <Sep />
        <Item label="Corto plazo" value={fmtShort(venta.montos.corto_plazo)} />
        {venta.plan_credito && (
          <>
            <Sep />
            <Item label="Enganche" value={fmtShort(venta.plan_credito.enganche)} />
            <Sep />
            <Item label="Parcialidad" value={fmtShort(venta.plan_credito.parcialidad)} />
          </>
        )}
      </div>
    </header>
  );
};

const Item = ({ label, value }: { label: string; value: string }) => (
  <span className="inline-flex items-baseline gap-1.5">
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</span>
    <span className="text-foreground">{value}</span>
  </span>
);

const Sep = () => <span className="text-muted-foreground/40">·</span>;

export default VentaDetalleHero;
