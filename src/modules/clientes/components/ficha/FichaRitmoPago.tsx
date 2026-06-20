import { useEffect, useRef, useState } from "react";
import type { EventoRitmo, PagoRitmo, RitmoPago, ResumenRitmo, SemanaRitmo } from "../../domain/entities/RitmoPago";
import type { Pulso } from "../../domain/entities/FichaCliente";
import { formatMoney, formatMoneyShort } from "../lib/format";
import { categoriaMeta } from "../lib/pagoConcepto";
import {
  EVENT_META,
  MONTH_SEP,
  GAP,
  computeMaxMonto,
  defaultWindow,
  dominantCategoria,
  eventsForWeek,
  formatMoneyCompact,
  groupByMonth,
  isCurrentWeek,
  monthSubtotal,
  type TooltipState,
} from "./lib/heatmapHelpers";
import { CellBands, Leyenda, SaldoSvg, Tooltip } from "./lib/HeatmapPrimitives";

// ─── Constants ────────────────────────────────────────────────────────────────

const BREAKPOINT = 700;

// ─── Mini-picker popover ──────────────────────────────────────────────────────

interface PickerAnchor {
  weekMs: number;
  x: number;
  y: number;
  pagos: PagoRitmo[];
}

function WeekPagosPicker({
  anchor,
  onSelect,
  onClose,
}: {
  anchor: PickerAnchor;
  onSelect: (doctoCcId: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label="Seleccionar pago"
      style={{ position: "fixed", left: anchor.x + 8, top: anchor.y + 8, zIndex: 50 }}
      className="min-w-[200px] rounded border border-border bg-popover shadow-md py-1"
    >
      {anchor.pagos.map((pago) => {
        const meta = categoriaMeta(pago.categoria);
        const fecha = pago.fecha.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const hora = pago.hora.slice(0, 5);
        return (
          <button
            key={pago.doctoCcId}
            role="option"
            aria-selected={false}
            type="button"
            className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
            onClick={() => {
              onSelect(pago.doctoCcId);
              onClose();
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass}`} />
              <span className="font-mono text-[11px] text-foreground">
                {fecha} {hora}
              </span>
              <span className={`ml-auto truncate max-w-[120px] ${meta.badgeClass}`}>
                {pago.concepto}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-3 font-mono text-[11px] text-muted-foreground">
              <span className="tabular-nums">{formatMoney(pago.importe)}</span>
              {pago.folio && (
                <span className="text-muted-foreground/60">{pago.folio}</span>
              )}
            </div>
          </button>
        );
      })}
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

// ─── Cell element — handles click / keyboard for pago navigation ──────────────

function HeatmapCell({
  semana,
  cellSize,
  maxMonto,
  onHover,
  onLeave,
  onPagoClick,
  onPickerOpen,
  className,
}: {
  semana: SemanaRitmo;
  cellSize: number;
  maxMonto: number;
  onHover: (e: React.MouseEvent, semana: SemanaRitmo) => void;
  onLeave: () => void;
  onPagoClick?: (doctoCcId: number) => void;
  onPickerOpen?: (coords: { x: number; y: number }, semana: SemanaRitmo) => void;
  className?: string;
}) {
  const monto = Number(semana.montoAbonado);
  const current = isCurrentWeek(semana);
  const hasPagos = semana.pagos.length > 0;
  const clickable = hasPagos && Boolean(onPagoClick);

  const wrapperClass = [
    "transition-transform",
    current ? "outline outline-2 outline-foreground/60 outline-offset-1" : "",
    "cursor-pointer hover:scale-125",
    className ?? "",
  ].filter(Boolean).join(" ");

  const ariaLabel = `Semana ${semana.semanaInicio.toLocaleDateString("es-MX")} — ${monto > 0 ? formatMoney(semana.montoAbonado) : "Sin pago"}`;

  const bands = (
    <CellBands
      movimientos={semana.pagos.map(p => ({ categoria: p.categoria, importe: Number(p.importe) }))}
      weekMonto={monto}
      maxMonto={maxMonto}
      size={cellSize}
    />
  );

  function openPicker(e: React.MouseEvent | React.KeyboardEvent) {
    if (!onPickerOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onPickerOpen({ x: rect.left, y: rect.bottom }, semana);
  }

  function handleClick(e: React.MouseEvent) {
    if (!onPagoClick) return;
    if (semana.pagos.length === 1) {
      onPagoClick(semana.pagos[0].doctoCcId);
    } else if (semana.pagos.length > 1) {
      openPicker(e);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!onPagoClick) return;
      if (semana.pagos.length === 1) {
        onPagoClick(semana.pagos[0].doctoCcId);
      } else if (semana.pagos.length > 1) {
        openPicker(e);
      }
    }
  }

  if (clickable) {
    return (
      <button
        type="button"
        style={{ width: cellSize, height: cellSize }}
        className={wrapperClass}
        aria-label={ariaLabel}
        onMouseMove={(e) => onHover(e, semana)}
        onMouseLeave={onLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {bands}
      </button>
    );
  }

  return (
    <div
      style={{ width: cellSize, height: cellSize }}
      className={wrapperClass}
      aria-label={ariaLabel}
      onMouseMove={(e) => onHover(e, semana)}
      onMouseLeave={onLeave}
    >
      {bands}
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
  onVentaClick,
  onPagoClick,
  onPickerOpen,
}: {
  semanas: SemanaRitmo[];
  eventos: EventoRitmo[];
  cellSize: number;
  maxMonto: number;
  onHover: (e: React.MouseEvent, semana: SemanaRitmo) => void;
  onLeave: () => void;
  onVentaClick?: (doctoPvId: number) => void;
  onPagoClick?: (doctoCcId: number) => void;
  onPickerOpen?: (coords: { x: number; y: number }, semana: SemanaRitmo) => void;
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
                        const { Icon, cls } = EVENT_META[ev.tipo];
                        return ev.doctoPvId > 0 ? (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onVentaClick?.(ev.doctoPvId)}
                            aria-label={`Ver venta ${ev.folio}`}
                            className="cursor-pointer focus:outline-none"
                          >
                            <Icon size={10} className={cls} />
                          </button>
                        ) : (
                          <Icon
                            key={i}
                            size={10}
                            className={cls}
                            aria-label={EVENT_META[ev.tipo].label}
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
            {g.semanas.map((s) => (
              <HeatmapCell
                key={s.semanaInicio.getTime()}
                semana={s}
                cellSize={cellSize}
                maxMonto={maxMonto}
                onHover={onHover}
                onLeave={onLeave}
                onPagoClick={onPagoClick}
                onPickerOpen={onPickerOpen}
              />
            ))}
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
  onVentaClick,
}: {
  semanas: SemanaRitmo[];
  eventos: EventoRitmo[];
  maxMonto: number;
  onVentaClick?: (doctoPvId: number) => void;
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
                                const { Icon, cls } = EVENT_META[ev.tipo];
                                return ev.doctoPvId > 0 ? (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => onVentaClick?.(ev.doctoPvId)}
                                    aria-label={`Ver venta ${ev.folio}`}
                                    className="cursor-pointer focus:outline-none"
                                  >
                                    <Icon size={7} className={cls} />
                                  </button>
                                ) : (
                                  <Icon
                                    key={i}
                                    size={7}
                                    className={cls}
                                    aria-label={EVENT_META[ev.tipo].label}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Cells — history panel uses simple divs (no pago click) */}
                  <div className="flex gap-[1px]">
                    {g.semanas.map((s) => {
                      const monto = Number(s.montoAbonado);
                      const dom = dominantCategoria(
                        s.pagos.map(p => ({ categoria: p.categoria, importe: Number(p.importe) })),
                      );
                      const opacity = dom !== null && maxMonto > 0
                        ? 0.4 + 0.6 * Math.min(1, monto / maxMonto)
                        : undefined;
                      return (
                        <div
                          key={s.semanaInicio.getTime()}
                          style={{
                            width: 11,
                            height: 11,
                            backgroundColor: dom !== null ? categoriaMeta(dom).color : undefined,
                            opacity,
                          }}
                          className={["rounded-[1px]", dom === null ? "bg-muted" : ""].join(" ")}
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
  onVentaClick,
  onPagoClick,
  onPickerOpen,
}: {
  semanas: SemanaRitmo[];
  eventos: EventoRitmo[];
  maxMonto: number;
  onHover: (e: React.MouseEvent, semana: SemanaRitmo) => void;
  onLeave: () => void;
  onVentaClick?: (doctoPvId: number) => void;
  onPagoClick?: (doctoCcId: number) => void;
  onPickerOpen?: (coords: { x: number; y: number }, semana: SemanaRitmo) => void;
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
              const evts = eventsForWeek(eventos, s);
              return (
                <div
                  key={s.semanaInicio.getTime()}
                  className="relative"
                  style={{ width: cellSize, height: cellSize }}
                >
                  <HeatmapCell
                    semana={s}
                    cellSize={cellSize}
                    maxMonto={maxMonto}
                    onHover={onHover}
                    onLeave={onLeave}
                    onPagoClick={onPagoClick}
                    onPickerOpen={onPickerOpen}
                  />
                  {evts.length > 0 && (
                    <div
                      className="absolute -right-0.5 -top-0.5 flex gap-px"
                      aria-label={evts.map(ev => EVENT_META[ev.tipo].label).join(", ")}
                    >
                      {evts.map((ev, i) => {
                        const { Icon, cls } = EVENT_META[ev.tipo];
                        return ev.doctoPvId > 0 ? (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onVentaClick?.(ev.doctoPvId)}
                            aria-label={`Ver venta ${ev.folio}`}
                            className="cursor-pointer focus:outline-none"
                          >
                            <Icon size={7} className={cls} />
                          </button>
                        ) : (
                          <Icon
                            key={i}
                            size={7}
                            className={cls}
                            aria-label={EVENT_META[ev.tipo].label}
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

// ─── Resumen strip ────────────────────────────────────────────────────────────

function ResumenStrip({
  semanas,
  resumen,
  pulso,
}: {
  semanas: SemanaRitmo[];
  resumen: ResumenRitmo;
  pulso?: Pulso | null;
}) {
  // ABONADO y PERDÓN vienen del dominio (backend ya discrimina por es_ingreso).
  const totalAbonado = Number(resumen.totalAbonado);
  const totalPerdonado = Number(resumen.totalPerdonado);

  // Semanas ACTIVAS = semanas en que el cliente tenía saldo por pagar (o pagó).
  // Esto excluye los periodos sin deuda (ya liquidado / antes de su compra), para
  // no castigar la constancia por semanas en las que no tenía obligación de pagar.
  const semanasActivas = semanas.filter(
    s => Number(s.saldo) > 0 || Number(s.montoAbonado) > 0,
  ).length;

  // ABONÓ EN / CONSTANCIA se miden sobre las semanas activas (mismo denominador).
  const semanasConPago = semanas.filter(s => Number(s.montoAbonado) > 0).length;

  // RACHA ACTUAL: semanas consecutivas con pago desde el FINAL de la ventana.
  let racha = 0;
  for (let i = semanas.length - 1; i >= 0; i--) {
    if (Number(semanas[i].montoAbonado) > 0) racha++;
    else break;
  }

  const constancia =
    semanasActivas > 0 ? Math.round((semanasConPago / semanasActivas) * 100) : 0;

  const stats: { label: string; value: string; unit?: string }[] = [
    {
      label: "ABONADO 12M",
      value: formatMoneyCompact(totalAbonado),
    },
    {
      label: "PERDÓN",
      value: formatMoneyCompact(totalPerdonado),
    },
    {
      label: "ABONÓ EN",
      value: String(semanasConPago),
      unit: `/${semanasActivas} sem`,
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
  if (pulso) {
    stats.push(
      { label: "CADENCIA", value: String(pulso.cadenciaDias), unit: " días" },
      { label: "ATRASO PROM", value: String(pulso.diasAtrasoProm), unit: " días" },
    );
  }

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

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  ritmo: RitmoPago | null;
  isLoading?: boolean;
  onVentaClick?: (doctoPvId: number) => void;
  onPagoClick?: (doctoCcId: number) => void;
  pulso?: Pulso | null;
}

export function FichaRitmoPago({ ritmo, isLoading, onVentaClick, onPagoClick, pulso }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [pickerAnchor, setPickerAnchor] = useState<PickerAnchor | null>(null);
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

  // Default window: last 52 weeks ending at today (backend generates through current week)
  const visibleSemanas = defaultWindow(ritmo.semanas);

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

  function handlePickerOpen(coords: { x: number; y: number }, semana: SemanaRitmo) {
    setPickerAnchor({
      weekMs: semana.semanaInicio.getTime(),
      x: coords.x,
      y: coords.y,
      pagos: semana.pagos,
    });
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
        <ResumenStrip semanas={visibleSemanas} resumen={ritmo.resumen} pulso={pulso} />
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
              onVentaClick={onVentaClick}
              onPagoClick={onPagoClick}
              onPickerOpen={handlePickerOpen}
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
          onVentaClick={onVentaClick}
          onPagoClick={onPagoClick}
          onPickerOpen={handlePickerOpen}
        />
      )}

      {showHistory && ritmo.semanas.length > 0 && (
        <FullHistoryPanel
          semanas={ritmo.semanas}
          eventos={ritmo.eventos}
          maxMonto={maxMonto}
          onVentaClick={onVentaClick}
        />
      )}

      <div className="mt-4">
        <Leyenda />
      </div>

      <Tooltip tooltip={tooltip} />

      {pickerAnchor && onPagoClick && (
        <WeekPagosPicker
          anchor={pickerAnchor}
          onSelect={onPagoClick}
          onClose={() => setPickerAnchor(null)}
        />
      )}
    </section>
  );
}
