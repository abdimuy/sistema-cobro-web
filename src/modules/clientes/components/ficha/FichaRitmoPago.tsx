import { useEffect, useRef, useState } from "react";
import { Banknote, CircleCheck, CreditCard } from "lucide-react";
import type { EventoRitmo, EventoTipo, RitmoPago, SemanaRitmo } from "../../domain/entities/RitmoPago";
import { formatMoney, formatMoneyShort, formatPct } from "../lib/format";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"] as const;
const WEEKS_DEFAULT = 52;
const BREAKPOINT = 700;
const GAP = 2; // px gap between cells

// ─── Cell intensity ───────────────────────────────────────────────────────────

function cellClass(monto: number): string {
  if (monto <= 0)   return "bg-muted";
  if (monto < 600)  return "[background:hsl(140,45%,78%)] dark:[background:hsl(143,28%,24%)]";
  if (monto < 900)  return "[background:hsl(143,50%,57%)] dark:[background:hsl(144,42%,35%)]";
  if (monto <= 1500) return "[background:hsl(146,62%,38%)] dark:[background:hsl(145,58%,47%)]";
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

  // X centers aligned to cells: each month group followed by a 4px separator
  const xCenters: number[] = [];
  let x = 0;
  let semIdx = 0;
  for (const g of monthGroups) {
    for (let i = 0; i < g.semanas.length; i++) {
      xCenters[semIdx++] = x + cellSize / 2;
      x += cellSize + GAP;
    }
    x += 4; // month separator
  }

  const totalW = x;
  const points = semanas.map((s, i) => {
    const cx = xCenters[i];
    const cy = H - 4 - ((Number(s.saldo) - minSaldo) / range) * (H - 8);
    return `${cx},${cy}`;
  }).join(" ");

  const firstSaldo = formatMoneyShort(semanas[0].saldo);
  const lastSaldo = formatMoneyShort(semanas[semanas.length - 1].saldo);

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
        {firstSaldo}
      </span>
      <span
        className="absolute bottom-0 right-0 font-mono text-[9px] text-muted-foreground/60 tabular-nums"
      >
        {lastSaldo}
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
  onHover,
  onLeave,
}: {
  semanas: SemanaRitmo[];
  eventos: EventoRitmo[];
  cellSize: number;
  onHover: (e: React.MouseEvent, semana: SemanaRitmo) => void;
  onLeave: () => void;
}) {
  const groups = groupByMonth(semanas);

  return (
    <div className="inline-flex flex-col gap-1 min-w-max">
        {/* Event lane */}
        <div className="flex items-end gap-[2px]">
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
              {/* month separator space */}
              {gi < groups.length - 1 && <div style={{ width: 4 }} />}
            </div>
          ))}
        </div>

        {/* Month labels */}
        <div className="flex items-end gap-[2px]">
          {groups.map((g, gi) => (
            <div key={g.key} className="flex gap-[2px]">
              <div style={{ width: g.semanas.length * cellSize + (g.semanas.length - 1) * GAP }}>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60">
                  {g.label}
                </span>
              </div>
              {gi < groups.length - 1 && <div style={{ width: 4 }} />}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="flex items-center gap-[2px]">
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
                      cellClass(monto),
                      current ? "outline outline-2 outline-foreground/60 outline-offset-1" : "",
                    ].join(" ")}
                    onMouseMove={(e) => onHover(e, s)}
                    onMouseLeave={onLeave}
                    aria-label={`Semana ${s.semanaInicio.toLocaleDateString("es-MX")} — ${monto > 0 ? formatMoney(s.montoAbonado) : "Sin pago"}`}
                  />
                );
              })}
              {gi < groups.length - 1 && <div style={{ width: 4 }} />}
            </div>
          ))}
        </div>

        {/* Monthly subtotals */}
        <div className="flex items-start gap-[2px]">
          {groups.map((g, gi) => (
            <div key={g.key} className="flex gap-[2px]">
              <div style={{ width: g.semanas.length * cellSize + (g.semanas.length - 1) * GAP }}>
                <span className="font-mono text-[9px] tabular-nums text-muted-foreground/50">
                  {formatMoneyShort(String(monthSubtotal(g.semanas)))}
                </span>
              </div>
              {gi < groups.length - 1 && <div style={{ width: 4 }} />}
            </div>
          ))}
        </div>
      </div>
  );
}

// ─── Vertical heatmap ─────────────────────────────────────────────────────────

function VerticalHeatmap({
  semanas,
  eventos,
  onHover,
  onLeave,
}: {
  semanas: SemanaRitmo[];
  eventos: EventoRitmo[];
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
                      cellClass(monto),
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

function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 rounded-[2px] bg-muted" />
        <span className="font-mono text-[9px] text-muted-foreground/60">Sin pago</span>
      </div>
      {[
        { cls: "[background:hsl(140,45%,78%)]", label: "< $600" },
        { cls: "[background:hsl(143,50%,57%)]", label: "$600–899" },
        { cls: "[background:hsl(146,62%,38%)]", label: "$900–1,500" },
        { cls: "[background:hsl(150,78%,24%)]", label: "> $1,500" },
      ].map(({ cls, label }) => (
        <div key={label} className="flex items-center gap-1">
          <div className={`h-3 w-3 rounded-[2px] ${cls}`} />
          <span className="font-mono text-[9px] text-muted-foreground/60">{label}</span>
        </div>
      ))}
      <div className="h-3 w-px bg-border/40 mx-1" />
      {(Object.entries(EVENT_META) as [EventoTipo, typeof EVENT_META[EventoTipo]][]).map(([tipo, { Icon, cls, label }]) => (
        <div key={tipo} className="flex items-center gap-1">
          <Icon size={10} className={cls} />
          <span className="font-mono text-[9px] text-muted-foreground/60">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Resumen strip ────────────────────────────────────────────────────────────

function ResumenStrip({ resumen }: { resumen: RitmoPago["resumen"] }) {
  const stats = [
    { label: "Abonado", value: formatMoney(resumen.totalAbonado) },
    { label: "Semanas", value: `${resumen.semanasConPago} / ${resumen.semanasActivas}` },
    { label: "Racha actual", value: `${resumen.rachaActualSem} sem` },
    { label: "Constancia", value: formatPct(resumen.constanciaPct) },
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {stats.map(({ label, value }) => (
        <div key={label} className="flex flex-col">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
            {label}
          </span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {value}
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
  const [showAll, setShowAll] = useState(false);
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

  // Window: last 52 weeks by default
  const cutoff = showAll
    ? new Date(0)
    : new Date(Date.now() - WEEKS_DEFAULT * 7 * 24 * 60 * 60 * 1000);
  const visibleSemanas = ritmo.semanas.filter(s => s.semanaInicio >= cutoff);

  const isHorizontal = containerWidth >= BREAKPOINT;

  // Compute fluid cell size for horizontal layout
  const weekCount = visibleSemanas.length;
  const monthCount = groupByMonth(visibleSemanas).length;
  // available = containerWidth - padding(32) - month separators
  const separators = Math.max(0, monthCount - 1) * 4;
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
            abonos semanales — ancla {ritmo.anclaDiaRuta}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(v => !v)}
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 underline-offset-2 hover:text-foreground hover:underline transition-colors"
        >
          {showAll ? "Últimos 12 meses" : "Ver historial completo"}
        </button>
      </div>

      <div className="mb-4">
        <ResumenStrip resumen={ritmo.resumen} />
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
          onHover={handleCellHover}
          onLeave={handleCellLeave}
        />
      )}

      <div className="mt-4">
        <Leyenda />
      </div>

      <Tooltip tooltip={tooltip} />
    </section>
  );
}
