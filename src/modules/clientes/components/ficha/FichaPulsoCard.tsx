import dayjs from "dayjs";
import "dayjs/locale/es";
import SegmentoBadge from "../badges/SegmentoBadge";
import EstadoPagoBadge from "../badges/EstadoPagoBadge";
import { formatMoney, formatPct } from "../lib/format";
import type { Pulso } from "../../domain/entities/FichaCliente";

dayjs.locale("es");


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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">Segmento</span>
          <SegmentoBadge value={pulso.segmento} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">Estado de pago</span>
          <EstadoPagoBadge value={pulso.estadoPago} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">Recencia</span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {pulso.recenciaDias === 0 ? "Hoy" : `hace ${pulso.recenciaDias} días`}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">Frecuencia</span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {pulso.frecuencia} compras
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">Monetario</span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {formatMoney(pulso.monetary)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">Por liquidar</span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {formatPct(pulso.porLiquidarPct)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">Última compra</span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {fmtDate(pulso.fechaUltimaCompra)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">Último pago</span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {fmtDate(pulso.fechaUltimoPago)}
          </span>
        </div>
      </div>

      {/* NBP — the "vender con IA" hook, highlighted */}
      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-primary/70">
          Próximo mejor producto
        </p>
        <p className="font-serif text-xl font-normal text-foreground">
          {pulso.nextBestProduct || "—"}
        </p>
      </div>
    </section>
  );
}
