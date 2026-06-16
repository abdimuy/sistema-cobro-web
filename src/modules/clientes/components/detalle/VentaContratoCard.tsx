import type { ContratoCredito } from "../../domain/entities";

const fmtMXN = (raw: string): string => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

const formaDePagoLabel: Record<string, string> = {
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
  CONTADO: "Contado",
};

interface Props {
  contrato: ContratoCredito;
}

export function VentaContratoCard({ contrato }: Props) {
  return (
    <section className="rounded-lg border border-border/60 bg-card">
      <header className="border-b border-border/60 px-5 py-3">
        <h3 className="font-serif text-lg font-normal text-foreground">
          Contrato de crédito
        </h3>
        <p className="text-xs text-muted-foreground">
          {formaDePagoLabel[contrato.formaDePago] ?? contrato.formaDePago} ·{" "}
          {contrato.plazoMeses} meses
        </p>
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-3">
        <Stat label="Parcialidad" value={fmtMXN(contrato.parcialidad)} />
        <Stat label="Enganche" value={fmtMXN(contrato.enganche)} />
        <Stat
          label="Precio de contado"
          value={fmtMXN(contrato.precioDeContado)}
        />
        <Stat label="Plazo" value={`${contrato.plazoMeses} meses`} />
        <Stat
          label="Forma de pago"
          value={formaDePagoLabel[contrato.formaDePago] ?? contrato.formaDePago}
        />
      </dl>
      {contrato.vendedores.length > 0 && (
        <div className="border-t border-border/60 px-5 pb-5 pt-4">
          <dt className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Vendedores
          </dt>
          <div className="flex flex-wrap gap-2">
            {contrato.vendedores.map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-0.5 text-xs font-medium text-foreground"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </dt>
    <dd className="tabular-nums mt-1 font-mono text-[15px] font-medium text-foreground">
      {value}
    </dd>
  </div>
);

export default VentaContratoCard;
