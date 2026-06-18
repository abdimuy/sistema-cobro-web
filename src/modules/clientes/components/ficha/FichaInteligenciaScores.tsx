import { ScoreMeter, type MeterBand } from "./ScoreMeter";
import { clvDrivers } from "./clvDrivers";
import { formatMoney, formatMoneyShort } from "../lib/format";
import type { Pulso } from "../../domain/entities/FichaCliente";

// FichaInteligenciaScores — the three customer-intelligence scores (credit risk,
// repurchase propensity, lifetime value) shown side by side, each as a band
// thermometer so a label like "media" has a visible scale to compare against,
// plus the "por qué" (drivers) for all three.

// ─── Band scales (mirror the committed backend cuts: msp-api
// internal/analytics/app/{scorecard,recompra_scorecard,clv_params}.json).
// Update these on model recalibration. Scores are 0–100; CLV is in pesos. ───────

const SCALE_CREDITO = {
  min: 0,
  max: 100,
  bands: [
    { label: "CRITICO", min: 0, color: "red" },
    { label: "ALTO", min: 18, color: "orange" },
    { label: "MEDIO", min: 76, color: "amber" },
    { label: "BAJO", min: 87, color: "green" },
  ] as MeterBand[],
};

const SCALE_RECOMPRA = {
  min: 0,
  max: 100,
  bands: [
    { label: "BAJA", min: 0, color: "gray" },
    { label: "MEDIA", min: 22, color: "amber" },
    { label: "ALTA", min: 53, color: "green" },
  ] as MeterBand[],
};

// CLV max=3000 keeps the ALTO zone (≥$1,226) visible; the marker clamps for
// higher-value clients (a maxed marker reads correctly as "top of the scale").
const SCALE_CLV = {
  min: 0,
  max: 3000,
  bands: [
    { label: "BAJO", min: 0, color: "gray" },
    { label: "MEDIO", min: 201, color: "amber" },
    { label: "ALTO", min: 1226, color: "green" },
  ] as MeterBand[],
};

// ─── Band → human statement (word + accent color) per dimension ────────────────

type Statement = { word: string; text: string };

const CREDITO_STMT: Record<string, Statement> = {
  BAJO: { word: "Riesgo bajo", text: "text-green-500" },
  MEDIO: { word: "Riesgo medio", text: "text-amber-500" },
  ALTO: { word: "Riesgo alto", text: "text-orange-500" },
  CRITICO: { word: "Riesgo crítico", text: "text-red-500" },
};

const RECOMPRA_STMT: Record<string, Statement> = {
  ALTA: { word: "Recompra alta", text: "text-green-500" },
  MEDIA: { word: "Recompra media", text: "text-amber-500" },
  BAJA: { word: "Recompra baja", text: "text-gray-400" },
};

const CLV_STMT: Record<string, Statement> = {
  ALTO: { word: "CLV alto", text: "text-green-500" },
  MEDIO: { word: "CLV medio", text: "text-amber-500" },
  BAJO: { word: "CLV bajo", text: "text-gray-400" },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function PorQue({ drivers }: { drivers: readonly string[] }) {
  if (drivers.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        Por qué
      </span>
      <ul className="space-y-0.5 pl-3">
        {drivers.map((driver, i) => (
          <li
            key={i}
            className="font-mono text-[11px] text-muted-foreground before:mr-1.5 before:text-muted-foreground/50 before:content-['·']"
          >
            {driver}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border/60 px-5 py-5">
      <div>
        <h4 className="font-serif text-sm font-normal text-foreground">{title}</h4>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

function EmptyPanel({
  title,
  subtitle,
  text,
}: {
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <Panel title={title} subtitle={subtitle}>
      <p className="font-mono text-[11px] italic text-muted-foreground/60">{text}</p>
    </Panel>
  );
}

function Statement({ stmt, detail }: { stmt: Statement; detail: string }) {
  return (
    <p className="flex items-baseline gap-2">
      <span className={`font-serif text-lg font-normal ${stmt.text}`}>
        {stmt.word}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground/70">
        {detail}
      </span>
    </p>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────

interface Props {
  pulso: Pulso | null;
}

export function FichaInteligenciaScores({ pulso }: Props) {
  if (!pulso) return null;

  const scoreTick = (n: number) => String(n);
  const clvTick = (n: number) => (n === 0 ? "" : formatMoneyShort(String(n)));

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Inteligencia de cliente"
    >
      <div className="mb-6">
        <h3 className="font-serif text-base font-normal text-foreground">
          Inteligencia de cliente
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          riesgo · recompra · valor
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* ── Riesgo de crédito ── */}
        {pulso.bandaCredito ? (
          <Panel title="Riesgo de crédito" subtitle="probabilidad de impago">
            <Statement
              stmt={CREDITO_STMT[pulso.bandaCredito] ?? RECOMPRA_STMT.MEDIA}
              detail={`${pulso.scoreCredito ?? 0} / 100`}
            />
            <ScoreMeter
              value={pulso.scoreCredito ?? 0}
              min={SCALE_CREDITO.min}
              max={SCALE_CREDITO.max}
              bands={SCALE_CREDITO.bands}
              activeBand={pulso.bandaCredito}
              valueLabel={String(pulso.scoreCredito ?? 0)}
              tickFormat={scoreTick}
              delayMs={0}
            />
            <PorQue drivers={pulso.creditoDrivers ?? []} />
          </Panel>
        ) : (
          <EmptyPanel
            title="Riesgo de crédito"
            subtitle="probabilidad de impago"
            text="Sin saldo a crédito"
          />
        )}

        {/* ── Propensión a recompra ── */}
        {pulso.bandaRecompra ? (
          <Panel title="Propensión a recompra" subtitle="próxima compra (12m)">
            <Statement
              stmt={RECOMPRA_STMT[pulso.bandaRecompra] ?? RECOMPRA_STMT.MEDIA}
              detail={`${pulso.scoreRecompra ?? 0} / 100`}
            />
            <ScoreMeter
              value={pulso.scoreRecompra ?? 0}
              min={SCALE_RECOMPRA.min}
              max={SCALE_RECOMPRA.max}
              bands={SCALE_RECOMPRA.bands}
              activeBand={pulso.bandaRecompra}
              valueLabel={String(pulso.scoreRecompra ?? 0)}
              tickFormat={scoreTick}
              delayMs={120}
            />
            <PorQue drivers={pulso.recompraDrivers ?? []} />
          </Panel>
        ) : (
          <EmptyPanel
            title="Propensión a recompra"
            subtitle="próxima compra (12m)"
            text="Sin historial de compras"
          />
        )}

        {/* ── Valor del cliente (CLV) ── */}
        {pulso.bandaClv && pulso.clv ? (
          <Panel title="Valor del cliente" subtitle="valor estimado (24m)">
            <Statement
              stmt={CLV_STMT[pulso.bandaClv] ?? CLV_STMT.MEDIO}
              detail={formatMoney(pulso.clv)}
            />
            <ScoreMeter
              value={Number(pulso.clv)}
              min={SCALE_CLV.min}
              max={SCALE_CLV.max}
              bands={SCALE_CLV.bands}
              activeBand={pulso.bandaClv}
              valueLabel={formatMoneyShort(pulso.clv)}
              tickFormat={clvTick}
              delayMs={240}
            />
            <PorQue drivers={clvDrivers(pulso)} />
          </Panel>
        ) : (
          <EmptyPanel
            title="Valor del cliente"
            subtitle="valor estimado (24m)"
            text="Sin historial de compras"
          />
        )}
      </div>
    </section>
  );
}
