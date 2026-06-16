import dayjs from "dayjs";
import "dayjs/locale/es";
import SegmentoBadge from "../badges/SegmentoBadge";
import EstadoPagoBadge from "../badges/EstadoPagoBadge";
import { formatMoney, formatPct } from "../lib/format";
import type { Pulso } from "../../domain/entities/FichaCliente";

dayjs.locale("es");

interface RowProps {
  label: string;
  children: React.ReactNode;
}

function Row({ label, children }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-2.5 last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right">{children}</span>
    </div>
  );
}

interface Props {
  pulso: Pulso | null;
}

export function FichaPulsoCard({ pulso }: Props) {
  if (!pulso) {
    return (
      <section
        className="border-b border-border/60 px-8 py-8"
        aria-label="Pulso analítico"
      >
        <div className="mb-5">
          <h3 className="font-serif text-base font-normal text-foreground">
            Pulso analítico
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            inteligencia de cliente
          </p>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground/60 italic">
          Este cliente aún no tiene pulso analítico (sin historial suficiente).
        </p>
      </section>
    );
  }

  const fmtDate = (d: Date | null): string => {
    if (!d) return "—";
    return dayjs(d).format("DD MMM YYYY");
  };

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Pulso analítico"
    >
      <div className="mb-5">
        <h3 className="font-serif text-base font-normal text-foreground">
          Pulso analítico
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          inteligencia de cliente
        </p>
      </div>

      <div className="max-w-lg">
        <Row label="Segmento">
          <SegmentoBadge value={pulso.segmento} />
        </Row>

        <Row label="Estado de pago">
          <EstadoPagoBadge value={pulso.estadoPago} />
        </Row>

        <Row label="Recencia">
          <span className="font-mono text-xs tabular-nums text-foreground">
            {pulso.recenciaDias === 0
              ? "Hoy"
              : `Última compra hace ${pulso.recenciaDias} días`}
          </span>
        </Row>

        <Row label="Frecuencia">
          <span className="font-mono text-xs tabular-nums text-foreground">
            {pulso.frecuencia} compras
          </span>
        </Row>

        <Row label="Monetario">
          <span className="font-mono text-xs tabular-nums text-foreground">
            {formatMoney(pulso.monetary)}
          </span>
        </Row>

        <Row label="Por liquidar">
          <span className="font-mono text-xs tabular-nums text-foreground">
            {formatPct(pulso.porLiquidarPct)}
          </span>
        </Row>

        <Row label="Última compra">
          <span className="font-mono text-xs tabular-nums text-foreground">
            {fmtDate(pulso.fechaUltimaCompra)}
          </span>
        </Row>

        <Row label="Último pago">
          <span className="font-mono text-xs tabular-nums text-foreground">
            {fmtDate(pulso.fechaUltimoPago)}
          </span>
        </Row>

        {/* NBP — the "vender con IA" hook, highlighted */}
        <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-primary/70">
            Próximo mejor producto
          </p>
          <p className="font-serif text-xl font-normal text-foreground">
            {pulso.nextBestProduct || "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
