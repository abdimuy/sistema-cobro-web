import dayjs from "dayjs";
import "dayjs/locale/es";
import TierRiesgoBadge from "../badges/TierRiesgoBadge";
import { formatMoney } from "../lib/format";
import type { Pulso } from "../../domain/entities/FichaCliente";

dayjs.locale("es");

// ─── Tier descriptions ────────────────────────────────────────────────────────

const tierDescriptions: Record<string, string> = {
  AL_DIA: "Al corriente con sus pagos",
  VIGILANCIA: "Algunos retrasos recientes",
  EN_RIESGO: "Historial de retrasos frecuentes",
  CRITICO: "Dejó de abonar / saldo en riesgo",
};

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

function EmptyNote({ text }: { text: string }) {
  return (
    <p className="font-mono text-[11px] italic text-muted-foreground/60">
      {text}
    </p>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-2 last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xs tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

// ─── Card 1 — Puntualidad ─────────────────────────────────────────────────────

function PuntualidadCard({ pulso }: { pulso: Pulso }) {
  if (pulso.numPagos === 0) {
    return (
      <Card title="Puntualidad" subtitle="historial de pagos">
        <EmptyNote text="Sin historial de pagos" />
      </Card>
    );
  }

  const pct = Number(pulso.pctPagosATiempo);
  const pctDisplay = Number.isFinite(pct) ? `${pct.toFixed(1)}%` : "—";

  return (
    <Card title="Puntualidad" subtitle="historial de pagos">
      {/* Large percentage figure */}
      <p className="font-serif text-4xl font-normal leading-none text-foreground tabular-nums">
        {pctDisplay}
        <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          a tiempo
        </span>
      </p>
      <div>
        <Stat label="Atraso prom." value={`${pulso.diasAtrasoProm} días`} />
        <Stat label="Cadencia" value={`${pulso.cadenciaDias} días`} />
        <Stat label="Pagos totales" value={String(pulso.numPagos)} />
      </div>
    </Card>
  );
}

// ─── Card 2 — Riesgo ─────────────────────────────────────────────────────────

function RiesgoCard({ pulso }: { pulso: Pulso }) {
  if (!pulso.tierRiesgo) {
    return (
      <Card title="Riesgo" subtitle="nivel de riesgo">
        <EmptyNote text="Sin clasificación" />
      </Card>
    );
  }

  const desc = tierDescriptions[pulso.tierRiesgo] ?? pulso.tierRiesgo;

  return (
    <Card title="Riesgo" subtitle="nivel de riesgo">
      <div className="flex flex-col gap-2">
        <TierRiesgoBadge value={pulso.tierRiesgo} />
        <p className="font-mono text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </Card>
  );
}

// ─── Card 3 — Próximo pago ────────────────────────────────────────────────────

function ProximoPagoCard({ pulso }: { pulso: Pulso }) {
  if (!pulso.fechaProxPago) {
    return (
      <Card title="Próximo pago" subtitle="proyección">
        <EmptyNote text="Sin pago programado" />
      </Card>
    );
  }

  const fechaFmt = dayjs(pulso.fechaProxPago).format("D MMM YYYY");
  const montoFmt = formatMoney(pulso.montoProxPago);

  return (
    <Card title="Próximo pago" subtitle="proyección">
      <div>
        <Stat label="Fecha" value={fechaFmt} />
        <Stat label="Monto" value={montoFmt} />
      </div>
    </Card>
  );
}

// ─── Public composite component ───────────────────────────────────────────────

interface Props {
  pulso: Pulso | null;
}

export function FichaCobranzaCards({ pulso }: Props) {
  if (!pulso) return null;

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Cobranza"
    >
      <div className="mb-5">
        <h3 className="font-serif text-base font-normal text-foreground">
          Cobranza
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          inteligencia de cobro
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PuntualidadCard pulso={pulso} />
        <RiesgoCard pulso={pulso} />
        <ProximoPagoCard pulso={pulso} />
      </div>
    </section>
  );
}
