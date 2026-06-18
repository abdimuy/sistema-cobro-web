import BandaClvBadge from "../badges/BandaClvBadge";
import { formatMoney } from "../lib/format";
import type { Pulso } from "../../domain/entities/FichaCliente";

// ─── Shared card shell ────────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border/60 px-5 py-4">
      <div>
        <h4 className="font-serif text-sm font-normal text-foreground">
          {title}
        </h4>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

// ─── FichaClvCard ─────────────────────────────────────────────────────────────

interface Props {
  pulso: Pulso | null;
}

export function FichaClvCard({ pulso }: Props) {
  if (!pulso?.bandaClv) return null;

  const { bandaClv, clv } = pulso;

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Valor del cliente"
    >
      <div className="mb-5">
        <h3 className="font-serif text-base font-normal text-foreground">
          Valor del cliente (CLV)
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          inteligencia de valor
        </p>
      </div>

      <Card title="Estimación" subtitle="banda y monto">
        <div className="flex flex-col gap-3">
          {/* Banda badge — includes formatted monto when available */}
          <BandaClvBadge banda={bandaClv} clv={clv} />

          {/* Monto prominente */}
          {clv && (
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Valor estimado
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatMoney(clv)}
              </span>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}
