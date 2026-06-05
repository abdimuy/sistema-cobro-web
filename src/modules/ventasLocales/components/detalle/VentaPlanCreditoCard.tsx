import { VentaV2 } from "@/services/api/ventaV2Types";

const fmt = (raw: string): string => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

const formatDia = (venta: VentaV2): string | null => {
  const d = venta.dia_cobranza;
  if (!d) return null;
  if (d.semana) return d.semana.charAt(0) + d.semana.slice(1).toLowerCase();
  if (d.mes != null) return `Día ${d.mes} del mes`;
  return null;
};

const labelFrec: Record<string, string> = {
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
};

export const VentaPlanCreditoCard = ({ venta }: { venta: VentaV2 }) => {
  if (!venta.plan_credito) return null;
  const plan = venta.plan_credito;
  const dia = formatDia(venta);

  return (
    <section className="rounded-lg border border-border/60 bg-card">
      <header className="border-b border-border/60 px-5 py-3">
        <h3 className="font-serif text-lg font-normal text-foreground">Plan de crédito</h3>
        <p className="text-xs text-muted-foreground">
          {labelFrec[plan.frec_pago] ?? plan.frec_pago} · {plan.plazo_meses} meses
        </p>
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-3">
        <Stat label="Enganche" value={fmt(plan.enganche)} />
        <Stat label="Parcialidad" value={fmt(plan.parcialidad)} />
        <Stat label="Plazo" value={`${plan.plazo_meses} meses`} />
        <Stat label="Frecuencia" value={labelFrec[plan.frec_pago] ?? plan.frec_pago} />
        {dia && <Stat label="Día de cobranza" value={dia} />}
      </dl>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </dt>
    <dd className="tabular mt-1 font-mono text-[15px] font-medium text-foreground">{value}</dd>
  </div>
);

export default VentaPlanCreditoCard;
