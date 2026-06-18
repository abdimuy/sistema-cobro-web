import { useEffect, useRef, useState } from "react";
import { Banknote, CircleCheck, CreditCard } from "lucide-react";
import type { EventoRitmo, EventoTipo, RitmoPago, SemanaRitmo } from "../../domain/entities/RitmoPago";
import { formatMoney, formatMoneyShort } from "../lib/format";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"] as const;
const WEEKS_DEFAULT = 52;
const BREAKPOINT = 700;
const GAP = 2;    // px gap between cells within a group
const MONTH_SEP = 4; // px spacer between month groups

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weekMs(d: Date): number {
  return d.getTime() + 7 * 24 * 60 * 60 * 1000;
}

function isCurrentWeek(semana: SemanaRitmo): boolean {
  const now = Date.now();
  return now >= semana.semanaInicio.getTime() && now < weekMs(semana.semanaInicio);
}

function eventsForWeek(eventos: EventoRitmo[], semana: SemanaRitmo): EventoRitmo[] {
  const start = semana.semanaInicio.getTime();
  const end = weekMs(semana.semanaInicio);
  return eventos.filter(e => e.fecha.getTime() >= start && e.fecha.getTime() < end);
}

function groupByMonth(semanas: SemanaRitmo[]): { key: string; label: string; semanas: SemanaRitmo[] }[] {
  const map = new Map<string, { label: string; semanas: SemanaRitmo[] }>();
  for (const s of semanas) {
    const y = s.semanaInicio.getFullYear();
    const m = s.semanaInicio.getMonth();
    const key = `${y}-${m}`;
    if (!map.has(key)) {
      map.set(key, { label: `${MONTH_NAMES[m]} ${y}`, semanas: [] });
    }
    map.get(key)!.semanas.push(s);
  }
  return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
}

function monthSubtotal(semanas: SemanaRitmo[]): number {
  return semanas.reduce((acc, s) => acc + Number(s.montoAbonado), 0);
}

/** Returns max non-zero montoAbonado across all semanas (stable — uses full dataset). */
function computeMaxMonto(semanas: SemanaRitmo[]): number {
  let max = 0;
  for (const s of semanas) {
    const m = Number(s.montoAbonado);
    if (m > max) max = m;
  }
  return max;
}

/**
 * Returns the 52-week window anchored to the last active week.
 * "Active" = montoAbonado > 0 OR has any event within that week range.
 */
function computeAnchorWindow(semanas: SemanaRitmo[], eventos: EventoRitmo[]): SemanaRitmo[] {
  if (semanas.length === 0) return [];

  // Find the last semana with monto > 0 or with an event
  let anchorIdx = -1;
  for (let i = semanas.length - 1; i >= 0; i--) {
    const s = semanas[i];
    if (Number(s.montoAbonado) > 0) { anchorIdx = i; break; }
    const evts = eventsForWeek(eventos, s);
    if (evts.length > 0) { anchorIdx = i; break; }
  }

  if (anchorIdx === -1) {
    // No activity at all — use last 52 weeks of the array
    return semanas.slice(-WEEKS_DEFAULT);
  }

  // Show 52 weeks ending at anchorIdx
  const start = Math.max(0, anchorIdx - WEEKS_DEFAULT + 1);
  return semanas.slice(start, anchorIdx + 1);
}

/** Format a number as compact money: $X.Xk */
function formatMoneyCompact(monto: number): string {
  if (monto <= 0) return "$0";
  const k = monto / 1000;
  return `$${k.toFixed(1)}k`;
}

// ─── Cell intensity (relative) ────────────────────────────────────────────────

function cellClass(monto: number, maxMonto: number): string {
  if (monto <= 0 || maxMonto <= 0) return "bg-muted";
  if (monto <= maxMonto * 0.25)    return "[background:hsl(140,45%,78%)] dark:[background:hsl(143,28%,24%)]";
  if (monto <= maxMonto * 0.50)    return "[background:hsl(143,50%,57%)] dark:[background:hsl(144,42%,35%)]";
  if (monto <= maxMonto * 0.75)    return "[background:hsl(146,62%,38%)] dark:[background:hsl(145,58%,47%)]";
  return "[background:hsl(150,78%,24%)] dark:[background:hsl(145,72%,62%)]";
}

// ─── Event icon ───────────────────────────────────────────────────────────────

const EVENT_META: Record<EventoTipo, { Icon: React.ElementType; cls: string; label: string }> = {
  venta_credito: {
    Icon: CreditCard,
    cls: "[color:hsl(217,91%,55%)] dark:[color:hsl(217,91%,64%)]",
    label: "Venta crédito",
  },
  venta_contado: {
    Icon: Banknote,
    cls: "[color:hsl(262,60%,58%)] dark:[color:hsl(262,75%,70%)]",
    label: "Venta contado",
  },
  liquidacion: {
    Icon: CircleCheck,
    cls: "[color:hsl(142,64%,38%)] dark:[color:hsl(142,64%,50%)]",
    label: "Liquidación",
  },
};

// ─── Tooltip state ────────────────────────────────────────────────────────────

type TooltipState = {
  x: number;
  y: number;
  semana: SemanaRitmo;
} | null;

// ─── Saldo SVG (horizontal) ───────────────────────────────────────────────────

function SaldoSvg({
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

// ─── Sparkline (vertical / compact) ──────────────────────────────────────────

function Sparkline({ semanas }: { semanas: SemanaRitmo[] }) {
  if (semanas.length < 2) return null;
  const H = 28;
  const W = 200;
  const saldos = semanas.map(s => Number(s.saldo));
  const maxS = Math.max(...saldos);
  const minS = Math.min(...saldos);
  const range = maxS - minS || 1;
  const step = W / (semanas.length - 1);
  const points = saldos.map((v, i) => {
    const cx = i * step;
    const cy = H - 2 - ((v - minS) / range) * (H - 4);
    return `${cx},${cy}`;
  }).join(" ");

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] text-muted-foreground/60">saldo</span>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground/50"
        />
      </svg>
      <span className="font-mono text-[9px] text-muted-foreground/60 tabular-nums">
        {formatMoneyShort(semanas[semanas.length - 1].saldo)}
      </span>
    </div>
  );
}

// ─── Horizontal heatmap ───────────────────────────────────────────────────────

function HorizontalHeatmap({
  semanas,
  eventos,
  cellSize,
  maxMonto,
  onHover,
  onLeave,
}: {
  semanas: SemanaRitmo[];
  eventos: EventoRitmo[];
  cellSize: number;
  maxMonto: number;
  onHover: (e: React.MouseEvent, semana: SemanaRitmo) => void;
  onLeave: () => void;
}) {
  const groups = groupByMonth(semanas);

  return (
    <div className="inline-flex flex-col gap-1 min-w-max">
      {/* Month labels — row 1 */}
      <div className="flex items-end">
        {groups.map((g, gi) => (
          <div key={g.key} className="flex gap-[2px]">
            <div style={{ width: g.semanas.length * cellSize + (g.semanas.length - 1) * GAP }}>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60">
                {g.label}
              </span>
            </div>
            {gi < groups.length - 1 && <div style={{ width: MONTH_SEP }} />}
          </div>
        ))}
      </div>

      {/* Event lane — row 2 (immediately above cells) */}
      <div className="flex items-end">
        {groups.map((g, gi) => (
          <div key={g.key} className="flex items-end gap-[2px]">
            {g.semanas.map((s) => {
              const evts = eventsForWeek(eventos, s);
              return (
                <div
                  key={s.semanaInicio.getTime()}
                  style={{ width: cellSize, height: 16 }}
                  className="flex items-center justify-center"
                >
                  {evts.length > 0 && (
                    <div
                      aria-label={evts.map(ev => EVENT_META[ev.tipo].label).join(", ")}
                      className="flex gap-0.5"
                    >
                      {evts.map((ev, i) => {
                        const { Icon, cls, label } = EVENT_META[ev.tipo];
                        return (
                          <Icon
                            key={i}
                            size={10}
                            className={cls}
                            aria-label={label}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Explicit spacer (not flex gap) so SaldoSvg X coords agree */}
            {gi < groups.length - 1 && <div style={{ width: MONTH_SEP }} />}
          </div>
        ))}
      </div>

      {/* Cells — row 3 */}
      <div className="flex items-center">
        {groups.map((g, gi) => (
          <div key={g.key} className="flex gap-[2px]">
            {g.semanas.map((s) => {
              const monto = Number(s.montoAbonado);
              const current = isCurrentWeek(s);
              return (
                <div
                  key={s.semanaInicio.getTime()}
                  style={{ width: cellSize, height: cellSize }}
                  className={[
                    "rounded-[2px] cursor-pointer hover:scale-125 transition-transform",
                    cellClass(monto, maxMonto),
                    current ? "outline outline-2 outline-foreground/60 outline-offset-1" : "",
                  ].join(" ")}
                  onMouseMove={(e) => onHover(e, s)}
                  onMouseLeave={onLeave}
                  aria-label={`Semana ${s.semanaInicio.toLocaleDateString("es-MX")} — ${monto > 0 ? formatMoney(s.montoAbonado) : "Sin pago"}`}
                />
              );
            })}
            {gi < groups.length - 1 && <div style={{ width: MONTH_SEP }} />}
          </div>
        ))}
      </div>

      {/* Monthly subtotals — row 4 */}
      <div className="flex items-start">
        {groups.map((g, gi) => (
          <div key={g.key} className="flex gap-[2px]">
            <div style={{ width: g.semanas.length * cellSize + (g.semanas.length - 1) * GAP }}>
              <span className="font-mono text-[9px] tabular-nums text-muted-foreground/50">
                {formatMoneyShort(String(monthSubtotal(g.semanas)))}
              </span>
            </div>
            {gi < groups.length - 1 && <div style={{ width: MONTH_SEP }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Full history panel ───────────────────────────────────────────────────────

function FullHistoryPanel({
  semanas,
  eventos,
  maxMonto,
}: {
  semanas: SemanaRitmo[];
  eventos: EventoRitmo[];
  maxMonto: number;
}) {
  // Group all semanas by year, then by month within each year
  const byYear = new Map<number, SemanaRitmo[]>();
  for (const s of semanas) {
    const y = s.semanaInicio.getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(s);
  }

  const years = Array.from(byYear.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="border-t border-dashed border-border/40 pt-3 mt-3 flex flex-col gap-4">
      {years.map(([year, ySemanas]) => {
        const monthGroups = groupByMonth(ySemanas);
        return (
          <div key={year} className="flex items-start gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/50 pt-1 w-8 shrink-0">
              {year}
            </span>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {monthGroups.map((g) => (
                <div key={g.key} className="flex flex-col gap-[1px]">
                  <span className="font-mono text-[8px] uppercase text-muted-foreground/40">
                    {g.label.split(" ")[0]}
                  </span>
                  {/* Icon lane */}
                  <div className="flex gap-[1px]">
                    {g.semanas.map((s) => {
                      const evts = eventsForWeek(eventos, s);
                      return (
                        <div
                          key={s.semanaInicio.getTime()}
                          style={{ width: 11, height: 11 }}
                          className="flex items-center justify-center"
                        >
                          {evts.length > 0 && (
                            <div className="flex">
                              {evts.map((ev, i) => {
                                const { Icon, cls, label } = EVENT_META[ev.tipo];
                                return (
                                  <Icon
                                    key={i}
                                    size={7}
                                    className={cls}
                                    aria-label={label}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Cells */}
                  <div className="flex gap-[1px]">
                    {g.semanas.map((s) => {
                      const monto = Number(s.montoAbonado);
                      return (
                        <div
                          key={s.semanaInicio.getTime()}
                          style={{ width: 11, height: 11 }}
                          className={[
                            "rounded-[1px]",
                            cellClass(monto, maxMonto),
                          ].join(" ")}
                          aria-label={`Semana ${s.semanaInicio.toLocaleDateString("es-MX")} — ${monto > 0 ? formatMoney(s.montoAbonado) : "Sin pago"}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Vertical heatmap ─────────────────────────────────────────────────────────

function VerticalHeatmap({
  semanas,
  eventos,
  maxMonto,
  onHover,
  onLeave,
}: {
  semanas: SemanaRitmo[];
  eventos: EventoRitmo[];
  maxMonto: number;
  onHover: (e: React.MouseEvent, semana: SemanaRitmo) => void;
  onLeave: () => void;
}) {
  const groups = groupByMonth(semanas);
  const cellSize = 14;

  return (
    <div className="flex flex-col gap-3">
      <Sparkline semanas={semanas} />
      {groups.map((g) => (
        <div key={g.key}>
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60">
            {g.label}
          </span>
          <div className="flex flex-wrap gap-[2px]">
            {g.semanas.map((s) => {
              const monto = Number(s.montoAbonado);
              const current = isCurrentWeek(s);
              const evts = eventsForWeek(eventos, s);
              return (
                <div
                  key={s.semanaInicio.getTime()}
                  className="relative"
                  style={{ width: cellSize, height: cellSize }}
                >
                  <div
                    style={{ width: cellSize, height: cellSize }}
                    className={[
                      "rounded-[2px] cursor-pointer hover:scale-125 transition-transform",
                      cellClass(monto, maxMonto),
                      current ? "outline outline-2 outline-foreground/60 outline-offset-1" : "",
                    ].join(" ")}
                    onMouseMove={(e) => onHover(e, s)}
                    onMouseLeave={onLeave}
                    aria-label={`Semana ${s.semanaInicio.toLocaleDateString("es-MX")} — ${monto > 0 ? formatMoney(s.montoAbonado) : "Sin pago"}`}
                  />
                  {evts.length > 0 && (
                    <div
                      className="pointer-events-none absolute -right-0.5 -top-0.5 flex gap-px"
                      aria-label={evts.map(ev => EVENT_META[ev.tipo].label).join(", ")}
                    >
                      {evts.map((ev, i) => {
                        const { Icon, cls, label } = EVENT_META[ev.tipo];
                        return (
                          <Icon
                            key={i}
                            size={7}
                            className={cls}
                            aria-label={label}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────

function Leyenda({ maxMonto }: { maxMonto: number }) {
  // Relative ramp: less → more, 5 swatches (g0–g4)
  const swatches = [
    { cls: "bg-muted" },
    { cls: "[background:hsl(140,45%,78%)] dark:[background:hsl(143,28%,24%)]" },
    { cls: "[background:hsl(143,50%,57%)] dark:[background:hsl(144,42%,35%)]" },
    { cls: "[background:hsl(146,62%,38%)] dark:[background:hsl(145,58%,47%)]" },
    { cls: "[background:hsl(150,78%,24%)] dark:[background:hsl(145,72%,62%)]" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Relative ramp */}
      <div className="flex items-center gap-1">
        <span className="font-mono text-[9px] text-muted-foreground/60">menos</span>
        {swatches.map(({ cls }, i) => (
          <div key={i} className={`h-3 w-3 rounded-[2px] ${cls}`} />
        ))}
        <span className="font-mono text-[9px] text-muted-foreground/60">más</span>
      </div>

      <div className="h-3 w-px bg-border/40 mx-1" />

      {/* Event icons */}
      {(Object.entries(EVENT_META) as [EventoTipo, typeof EVENT_META[EventoTipo]][]).map(([tipo, { Icon, cls, label }]) => (
        <div key={tipo} className="flex items-center gap-1">
          <Icon size={10} className={cls} />
          <span className="font-mono text-[9px] text-muted-foreground/60">{label}</span>
        </div>
      ))}

      {/* Invisible consumer of maxMonto to avoid lint warning */}
      {maxMonto < 0 && <span />}
    </div>
  );
}

// ─── Resumen strip ────────────────────────────────────────────────────────────

function ResumenStrip({ semanas }: { semanas: SemanaRitmo[] }) {
  // ABONADO 12M: sum of visible montoAbonado
  const totalAbonado = semanas.reduce((acc, s) => acc + Number(s.montoAbonado), 0);

  // ABONÓ EN: semanasConPago / total
  const semanasConPago = semanas.filter(s => Number(s.montoAbonado) > 0).length;
  const total = semanas.length;

  // RACHA ACTUAL: consecutive paid weeks from the END of the array
  let racha = 0;
  for (let i = semanas.length - 1; i >= 0; i--) {
    if (Number(semanas[i].montoAbonado) > 0) racha++;
    else break;
  }

  // CONSTANCIA: conPago / activas * 100
  // activas = weeks from first paid week onward
  const firstPaidIdx = semanas.findIndex(s => Number(s.montoAbonado) > 0);
  const activas = firstPaidIdx >= 0 ? semanas.length - firstPaidIdx : 0;
  const constancia = activas > 0 ? Math.round((semanasConPago / activas) * 100) : 0;

  const stats: { label: string; value: string; unit?: string }[] = [
    {
      label: "ABONADO 12M",
      value: formatMoneyCompact(totalAbonado),
    },
    {
      label: "ABONÓ EN",
      value: String(semanasConPago),
      unit: `/${total} sem`,
    },
    {
      label: "RACHA ACTUAL",
      value: String(racha),
      unit: " sem",
    },
    {
      label: "CONSTANCIA",
      value: `${constancia}%`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {stats.map(({ label, value, unit }) => (
        <div key={label} className="flex flex-col">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
            {label}
          </span>
          <span className="font-serif text-[27px] leading-none text-foreground">
            {value}
            {unit && (
              <small className="font-mono text-[11px] text-muted-foreground/70">{unit}</small>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip) return null;
  const monto = Number(tooltip.semana.montoAbonado);
  const label = monto > 0 ? formatMoney(tooltip.semana.montoAbonado) : "Sin pago";
  const dateStr = tooltip.semana.semanaInicio.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-md border border-border bg-background px-2 py-1.5 shadow-md"
      style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
    >
      <p className="font-mono text-[10px] text-muted-foreground">{dateStr}</p>
      <p className="font-mono text-xs tabular-nums text-foreground">{label}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  ritmo: RitmoPago | null;
  isLoading?: boolean;
}

export function FichaRitmoPago({ ritmo, isLoading }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width || 800);
    return () => ro.disconnect();
  }, []);

  if (isLoading && !ritmo) return null;
  if (!ritmo) return null;

  // maxMonto computed from ALL semanas (stable, independent of window)
  const maxMonto = computeMaxMonto(ritmo.semanas);

  // Anchor window: 52 weeks ending at last active week
  const visibleSemanas = computeAnchorWindow(ritmo.semanas, ritmo.eventos);

  const isHorizontal = containerWidth >= BREAKPOINT;

  // Compute fluid cell size for horizontal layout
  const weekCount = visibleSemanas.length;
  const monthCount = groupByMonth(visibleSemanas).length;
  const separators = Math.max(0, monthCount - 1) * MONTH_SEP;
  const gaps = Math.max(0, weekCount - 1) * GAP;
  const available = containerWidth - 32 - separators - gaps;
  const cellSize = Math.max(9, Math.min(22, Math.floor(available / Math.max(1, weekCount))));

  const monthGroups = groupByMonth(visibleSemanas);

  function handleCellHover(e: React.MouseEvent, semana: SemanaRitmo) {
    setTooltip({ x: e.clientX, y: e.clientY, semana });
  }

  function handleCellLeave() {
    setTooltip(null);
  }

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Ritmo de pago"
      ref={containerRef}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-base font-normal text-foreground">
            Ritmo de pago
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            abonos semanales · últimos 12 meses
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory(v => !v)}
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 underline-offset-2 hover:text-foreground hover:underline transition-colors"
        >
          {showHistory ? "Ocultar historial" : "Ver historial completo"}
        </button>
      </div>

      <div className="mb-4">
        <ResumenStrip semanas={visibleSemanas} />
      </div>

      {visibleSemanas.length === 0 ? (
        <p className="font-mono text-[11px] italic text-muted-foreground/60">
          Sin semanas en este período
        </p>
      ) : isHorizontal ? (
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1 min-w-max">
            <HorizontalHeatmap
              semanas={visibleSemanas}
              eventos={ritmo.eventos}
              cellSize={cellSize}
              maxMonto={maxMonto}
              onHover={handleCellHover}
              onLeave={handleCellLeave}
            />
            <SaldoSvg
              semanas={visibleSemanas}
              cellSize={cellSize}
              monthGroups={monthGroups}
            />
          </div>
        </div>
      ) : (
        <VerticalHeatmap
          semanas={visibleSemanas}
          eventos={ritmo.eventos}
          maxMonto={maxMonto}
          onHover={handleCellHover}
          onLeave={handleCellLeave}
        />
      )}

      {showHistory && ritmo.semanas.length > 0 && (
        <FullHistoryPanel
          semanas={ritmo.semanas}
          eventos={ritmo.eventos}
          maxMonto={maxMonto}
        />
      )}

      <div className="mt-4">
        <Leyenda maxMonto={maxMonto} />
      </div>

      <Tooltip tooltip={tooltip} />
    </section>
  );
}
