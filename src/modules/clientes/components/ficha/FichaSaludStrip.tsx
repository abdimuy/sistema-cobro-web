import dayjs from "dayjs";
import "dayjs/locale/es";
import EstadoPagoBadge from "../badges/EstadoPagoBadge";
import { formatMoney, formatPct } from "../lib/format";
import type { ResumenFicha, Pulso } from "../../domain/entities/FichaCliente";

dayjs.locale("es");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StripItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
        {label}
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
  let proxPagoFecha: string | null = null;
  let proxPagoMonto: string | null = null;
  if (pulso !== null && pulso.fechaProxPago !== null) {
    proxPagoFecha = dayjs(pulso.fechaProxPago).format("D MMM YYYY");
    proxPagoMonto = formatMoney(pulso.montoProxPago);
  }

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
        <StripItem label="Puntualidad">
          <span className="font-serif text-[22px] leading-none tabular-nums text-foreground">
            {puntualidadDisplay}
          </span>
        </StripItem>

        {/* 3. Próximo pago */}
        <StripItem label="Próximo pago">
          {proxPagoFecha !== null ? (
            <>
              <span className="font-mono text-xs tabular-nums text-foreground">
                {proxPagoFecha}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground/70">
                {proxPagoMonto}
              </span>
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
