import { createPortal } from "react-dom";
import type { EventoTipo, SemanaRitmo } from "../../../domain/entities/RitmoPago";
import type { CategoriaPago } from "../../../domain/values/CategoriaPago";
import { formatMoney } from "../../lib/format";
import { categoriaMeta } from "../../lib/pagoConcepto";
import { EVENT_META, GAP, MONTH_SEP, formatMoneyCompact, type TooltipState } from "./heatmapHelpers";

// ─── CellBands ────────────────────────────────────────────────────────────────

export function CellBands({
  movimientos,
  weekMonto,
  maxMonto,
  size,
}: {
  movimientos: { categoria: CategoriaPago; importe: number }[];
  weekMonto: number;
  maxMonto: number;
  size: number;
}) {
  if (movimientos.length === 0) {
    return <div className="rounded-[2px] bg-muted" style={{ width: size, height: size }} />;
  }
  const opacity = 0.4 + 0.6 * (maxMonto > 0 ? Math.min(1, weekMonto / maxMonto) : 0);
  return (
    <div className="relative flex overflow-hidden rounded-[2px]" style={{ width: size, height: size }}>
      {movimientos.map((m, i) => (
        <div
          key={i}
          className="flex-1"
          style={{ backgroundColor: categoriaMeta(m.categoria).color, opacity }}
        />
      ))}
      {movimientos.length >= 2 && (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-bold leading-none text-white text-[9px]"
          style={{ textShadow: "0 0 2px rgba(0,0,0,0.95), 0 0 1px rgba(0,0,0,0.95)" }}
        >
          {movimientos.length}
        </span>
      )}
    </div>
  );
}

// ─── Saldo SVG (horizontal) ───────────────────────────────────────────────────

export function SaldoSvg({
  semanas,
  cellSize,
  monthGroups,
}: {
  semanas: SemanaRitmo[];
  cellSize: number;
  monthGroups: { semanas: SemanaRitmo[] }[];
}) {
  if (semanas.length < 2) return null;

  const H = 36;
  const saldos = semanas.map(s => Number(s.saldo));
  const maxSaldo = Math.max(...saldos);
  const minSaldo = Math.min(...saldos);
  const range = maxSaldo - minSaldo || 1;

  // X centers: each cell center, explicit MONTH_SEP spacer between groups (no flex gap)
  const xCenters: number[] = [];
  let x = 0;
  let semIdx = 0;
  for (const g of monthGroups) {
    for (let i = 0; i < g.semanas.length; i++) {
      xCenters[semIdx++] = x + cellSize / 2;
      x += cellSize + GAP;
    }
    x += MONTH_SEP; // explicit spacer (matches DOM explicit spacer divs)
  }

  const totalW = x;
  const points = semanas.map((s, i) => {
    const cx = xCenters[i];
    const cy = H - 4 - ((Number(s.saldo) - minSaldo) / range) * (H - 8);
    return `${cx},${cy}`;
  }).join(" ");

  const firstSaldo = formatMoneyCompact(Number(semanas[0].saldo));
  const lastSaldo = formatMoneyCompact(Number(semanas[semanas.length - 1].saldo));

  return (
    <div className="relative" style={{ height: H + 16 }}>
      <svg
        width={totalW}
        height={H}
        viewBox={`0 0 ${totalW} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground/50"
        />
        {xCenters.map((cx, i) => (
          <circle
            key={i}
            cx={cx}
            cy={H - 4 - ((saldos[i] - minSaldo) / range) * (H - 8)}
            r="2"
            className="fill-muted-foreground/50"
          />
        ))}
      </svg>
      <span
        className="absolute bottom-0 left-0 font-mono text-[9px] text-muted-foreground/60 tabular-nums"
      >
        saldo {firstSaldo}
      </span>
      <span
        className="absolute bottom-0 right-0 font-mono text-[9px] text-muted-foreground/60 tabular-nums"
      >
        saldo hoy {lastSaldo}
      </span>
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export function Tooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip) return null;
  const monto = Number(tooltip.semana.montoAbonado);
  const label = monto > 0 ? formatMoney(tooltip.semana.montoAbonado) : "Sin pago";
  const dateStr = tooltip.semana.semanaInicio.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Rendered through a portal to <body> so `position: fixed` resolves against
  // the viewport. Inside a modal/Dialog (whose animation applies a CSS
  // transform), a non-portaled fixed element would be positioned relative to
  // that transformed ancestor instead, pushing the tooltip far off (e.g. to
  // the right edge). The portal keeps cursor coords (clientX/clientY) correct.
  return createPortal(
    <div
      className="pointer-events-none fixed z-[100] rounded-md border border-border bg-background px-2 py-1.5 shadow-md"
      style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
    >
      <p className="font-mono text-[10px] text-muted-foreground">{dateStr}</p>
      <p className="font-mono text-xs tabular-nums text-foreground">{label}</p>
    </div>,
    document.body,
  );
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────

const LEYENDA_CATS: readonly CategoriaPago[] = ["pago", "enganche", "condonacion", "perdida"];

export function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Category dots */}
      <div className="flex items-center gap-3">
        {LEYENDA_CATS.map((cat) => {
          const m = categoriaMeta(cat);
          return (
            <div key={cat} className="flex items-center gap-1">
              <span className={`h-2 w-2 shrink-0 rounded-full ${m.dotClass}`} />
              <span className="font-mono text-[9px] text-muted-foreground/60">{m.label}</span>
            </div>
          );
        })}
      </div>

      <div className="h-3 w-px bg-border/40 mx-1" />

      {/* Event icons */}
      {(Object.entries(EVENT_META) as [EventoTipo, typeof EVENT_META[EventoTipo]][]).map(([tipo, { Icon, cls, label }]) => (
        <div key={tipo} className="flex items-center gap-1">
          <Icon size={10} className={cls} />
          <span className="font-mono text-[9px] text-muted-foreground/60">{label}</span>
        </div>
      ))}
    </div>
  );
}
