import dayjs from "dayjs";
import "dayjs/locale/es";
import EstadoPagoBadge from "../badges/EstadoPagoBadge";
import { formatMoney, formatPct } from "../lib/format";
import { InfoHint } from "./lib/InfoHint";
import type { ResumenFicha, Pulso } from "../../domain/entities/FichaCliente";

dayjs.locale("es");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StripItem({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
        {label}
        {hint && <InfoHint text={hint} label={label} />}
      </span>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

// ─── FichaSaludStrip ─────────────────────────────────────────────────────────

interface Props {
  resumen: ResumenFicha;
  pulso: Pulso | null;
}

export function FichaSaludStrip({ resumen, pulso }: Props) {
  // ── % Liquidado ─────────────────────────────────────────────────────────────
  const compradoNum = Number(resumen.totalComprado);
  const showLiquidado = Number.isFinite(compradoNum) && compradoNum !== 0;

  const rawPct = Number(resumen.pctLiquidado);
  const pct = Number.isFinite(rawPct) ? Math.min(100, Math.max(0, rawPct)) : 0;
  const pctLabel = formatPct(String(pct));

  // ── Puntualidad ──────────────────────────────────────────────────────────────
  let puntualidadDisplay = "—";
  if (pulso !== null && pulso.numPagos !== 0) {
    const n = Number(pulso.pctPagosATiempo);
    puntualidadDisplay = Number.isFinite(n) ? `${n.toFixed(1)}%` : "—";
  }

  // ── Próximo pago ─────────────────────────────────────────────────────────────
  // The expected next-payment date can fall in the past for a delinquent client
  // (the backend keeps it as last payment + cadencia). When it has, surface
  // "vencido hace N días" so the stale future-looking date is not misread as on time.
  let proxPagoFecha: string | null = null;
  let proxPagoMonto: string | null = null;
  let proxPagoVencidoDias = 0;
  if (pulso !== null && pulso.fechaProxPago !== null) {
    proxPagoFecha = dayjs(pulso.fechaProxPago).format("D MMM YYYY");
    proxPagoMonto = formatMoney(pulso.montoProxPago);
    proxPagoVencidoDias = dayjs()
      .startOf("day")
      .diff(dayjs(pulso.fechaProxPago).startOf("day"), "day");
  }
  const proxPagoVencido = proxPagoVencidoDias > 0;

  return (
    <section
      className="border-b border-border/60 px-8 py-4"
      aria-label="De un vistazo"
    >
      <div className="flex flex-wrap gap-x-8 gap-y-3 items-start">
        {/* 1. % Liquidado */}
        {showLiquidado && (
          <StripItem label="% Liquidado">
            <span className="font-serif text-[22px] leading-none tabular-nums text-foreground">
              {pctLabel}
            </span>
            {/* Thin progress bar */}
            <div
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Liquidación: ${pctLabel}`}
              className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-green-600 dark:bg-green-500 transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[9px] tabular-nums text-muted-foreground/60">
              {formatMoney(resumen.totalAbonado)} de {formatMoney(resumen.totalComprado)}
            </span>
          </StripItem>
        )}

        {/* 2. Puntualidad */}
        <StripItem label="Puntualidad" hint="% de pagos hechos dentro de su cadencia (+7 días de tolerancia).">
          <span className="font-serif text-[22px] leading-none tabular-nums text-foreground">
            {puntualidadDisplay}
          </span>
        </StripItem>

        {/* 3. Próximo pago */}
        <StripItem label="Próximo pago" hint="Fecha estimada del siguiente pago (último pago + cadencia).">
          {proxPagoFecha !== null ? (
            <>
              <span
                className={`font-mono text-xs tabular-nums ${
                  proxPagoVencido ? "text-amber-600 dark:text-amber-500" : "text-foreground"
                }`}
              >
                {proxPagoFecha}
              </span>
              {proxPagoVencido ? (
                <span className="font-mono text-xs tabular-nums text-amber-600 dark:text-amber-500 font-medium">
                  Vencido hace {proxPagoVencidoDias}{" "}
                  {proxPagoVencidoDias === 1 ? "día" : "días"}
                </span>
              ) : (
                <span className="font-mono text-xs tabular-nums text-muted-foreground/70">
                  {proxPagoMonto}
                </span>
              )}
            </>
          ) : (
            <span className="font-mono text-xs text-muted-foreground/60 italic">
              Sin pago programado
            </span>
          )}
        </StripItem>

        {/* 4. Estado de pago */}
        <StripItem label="Estado de pago">
          {pulso !== null ? (
            <EstadoPagoBadge value={pulso.estadoPago} />
          ) : (
            <span className="font-mono text-xs text-muted-foreground/60">—</span>
          )}
        </StripItem>
      </div>
    </section>
  );
}
