import dayjs from "dayjs";
import "dayjs/locale/es";
import { ScoreMeter, type MeterBand } from "./ScoreMeter";
import { clvDrivers } from "./clvDrivers";
import { formatMoney } from "../lib/format";
import SegmentoBadge from "../badges/SegmentoBadge";
import { InfoHint } from "./lib/InfoHint";
import type { Pulso } from "../../domain/entities/FichaCliente";

dayjs.locale("es");

// FichaInteligenciaScores — the three customer-intelligence scores (credit risk,
// repurchase propensity, lifetime value) shown side by side, each as a band
// thermometer with a bullet list of drivers.

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
  BAJO: { word: "BAJO riesgo", text: "text-green-500" },
  MEDIO: { word: "MEDIO riesgo", text: "text-amber-500" },
  ALTO: { word: "ALTO riesgo", text: "text-orange-500" },
  CRITICO: { word: "CRÍTICO riesgo", text: "text-red-500" },
};

const RECOMPRA_STMT: Record<string, Statement> = {
  ALTA: { word: "ALTA recompra", text: "text-green-500" },
  MEDIA: { word: "MEDIA recompra", text: "text-amber-500" },
  BAJA: { word: "BAJA recompra", text: "text-gray-400" },
};

const CLV_STMT: Record<string, Statement> = {
  ALTO: { word: "CLV alto", text: "text-green-500" },
  MEDIO: { word: "CLV medio", text: "text-amber-500" },
  BAJO: { word: "CLV bajo", text: "text-gray-400" },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

// Accent dot color per score dimension — purely decorative, not load-bearing.
type AccentColor = "red" | "orange" | "amber" | "green" | "gray";

const ACCENT_DOT: Record<AccentColor, string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  gray: "bg-gray-400",
};

function DriverList({ drivers, accent }: { drivers: readonly string[]; accent: AccentColor }) {
  if (drivers.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1" aria-label="Factores del score">
      {drivers.map((driver, i) => (
        <li key={i} className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${ACCENT_DOT[accent]}`} aria-hidden="true" />
          {driver}
        </li>
      ))}
    </ul>
  );
}

function Panel({
  title,
  titleHint,
  subtitle,
  children,
}: {
  title: string;
  titleHint?: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border/60 px-5 py-5">
      <div>
        <h4 className="flex items-center gap-1 font-serif text-sm font-normal text-foreground">
          {title}
          {titleHint && <InfoHint text={titleHint} label={title} />}
        </h4>
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
  titleHint,
  subtitle,
  text,
}: {
  title: string;
  titleHint?: string;
  subtitle: string;
  text: string;
}) {
  return (
    <Panel title={title} titleHint={titleHint} subtitle={subtitle}>
      <p className="font-mono text-[11px] italic text-muted-foreground/60">{text}</p>
    </Panel>
  );
}

function Statement({ stmt, detail }: { stmt: Statement; detail: string }) {
  return (
    <p className="flex items-baseline justify-between gap-2">
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

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Inteligencia del cliente"
    >
      <div className="mb-6">
        <h3 className="font-serif text-base font-normal text-foreground">
          Inteligencia del cliente
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          scores · explica el porqué
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* ── Riesgo de crédito ── */}
        {pulso.bandaCredito ? (
          <Panel title="Riesgo de crédito" titleHint="Qué tan buen pagador es (0–100). Mayor = menor riesgo de impago." subtitle="calidad de pago">
            <Statement
              stmt={CREDITO_STMT[pulso.bandaCredito] ?? CREDITO_STMT.MEDIO}
              detail={`${pulso.scoreCredito ?? 0} / 100`}
            />
            <ScoreMeter
              value={pulso.scoreCredito ?? 0}
              min={SCALE_CREDITO.min}
              max={SCALE_CREDITO.max}
              bands={SCALE_CREDITO.bands}
              activeBand={pulso.bandaCredito}
            />
            <DriverList
              drivers={pulso.creditoDrivers ?? []}
              accent={
                pulso.bandaCredito === "BAJO"
                  ? "green"
                  : pulso.bandaCredito === "MEDIO"
                    ? "amber"
                    : pulso.bandaCredito === "ALTO"
                      ? "orange"
                      : "red"
              }
            />
          </Panel>
        ) : (
          <EmptyPanel
            title="Riesgo de crédito"
            titleHint="Qué tan buen pagador es (0–100). Mayor = menor riesgo de impago."
            subtitle="calidad de pago"
            text="Sin saldo a crédito"
          />
        )}

        {/* ── Propensión a recompra ── */}
        {pulso.bandaRecompra ? (
          <Panel title="Propensión a recompra" titleHint="Probabilidad de que vuelva a comprar en los próximos 12 meses." subtitle="próxima compra (12m)">
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
            />
            <DriverList
              drivers={pulso.recompraDrivers ?? []}
              accent={
                pulso.bandaRecompra === "ALTA"
                  ? "green"
                  : pulso.bandaRecompra === "MEDIA"
                    ? "amber"
                    : "gray"
              }
            />
          </Panel>
        ) : (
          <EmptyPanel
            title="Propensión a recompra"
            titleHint="Probabilidad de que vuelva a comprar en los próximos 12 meses."
            subtitle="próxima compra (12m)"
            text="Sin historial de compras"
          />
        )}

        {/* ── Valor del cliente (CLV) ── */}
        {pulso.bandaClv && pulso.clv ? (
          <Panel title="Valor del cliente" titleHint="Valor estimado que dejará en 24 meses, ajustado por riesgo." subtitle="valor estimado (24m)">
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
            />
            <DriverList
              drivers={clvDrivers(pulso)}
              accent={
                pulso.bandaClv === "ALTO"
                  ? "green"
                  : pulso.bandaClv === "MEDIO"
                    ? "amber"
                    : "gray"
              }
            />
          </Panel>
        ) : (
          <EmptyPanel
            title="Valor del cliente"
            titleHint="Valor estimado que dejará en 24 meses, ajustado por riesgo."
            subtitle="valor estimado (24m)"
            text="Sin historial de compras"
          />
        )}
      </div>

      {/* ── Contexto RFM ── */}
      <div className="mt-6">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
          Contexto
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
              Segmento
            </span>
            <SegmentoBadge value={pulso.segmento} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
              Recencia
            </span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {pulso.recenciaDias === 0 ? "Hoy" : `hace ${pulso.recenciaDias} días`}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
              Frecuencia
            </span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {pulso.frecuencia} compras
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
              Monetario
            </span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {formatMoney(pulso.monetary)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
              Última compra
            </span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {pulso.fechaUltimaCompra
                ? dayjs(pulso.fechaUltimaCompra).format("DD MMM YYYY")
                : "—"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
              Último pago
            </span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {pulso.fechaUltimoPago
                ? dayjs(pulso.fechaUltimoPago).format("DD MMM YYYY")
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
