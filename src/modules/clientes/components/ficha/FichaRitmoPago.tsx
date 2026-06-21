import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  esCategoriaIngreso,
  eventsForWeek,
  formatMoneyCompact,
  groupByMonth,
  isCurrentWeek,
  monthSubtotal,
  type TooltipState,
} from "./lib/heatmapHelpers";
import { CellBands, Leyenda, SaldoSvg, Tooltip } from "./lib/HeatmapPrimitives";
import {
  Tooltip as UITooltip,
  TooltipContent as UITooltipContent,
  TooltipProvider as UITooltipProvider,
  TooltipTrigger as UITooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoHint } from "./lib/InfoHint";

// ─── Constants ────────────────────────────────────────────────────────────────

const BREAKPOINT = 700;

// Fixed horizontal cell size (px). Matches the size the fluid layout reached on
// a wide panel (its 22px cap) — the size users saw most of the time. Constant so
// the heatmap never shrinks on a width-measurement glitch; it scrolls instead.
const HEATMAP_CELL_SIZE = 22;

// ─── Event icon + hover info card ─────────────────────────────────────────────

// EventInfoCard is the content shown when hovering a heatmap event icon (venta a
// crédito / contado / liquidación): explains the marker with its date, amount and
// folio so the icon is no longer a mystery glyph.
function EventInfoCard({ ev }: { ev: EventoRitmo }) {
  const { label } = EVENT_META[ev.tipo];
  const fecha = ev.fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="leading-tight">
      <p className="font-mono text-[10px] uppercase tracking-wider">{label}</p>
      <p className="font-mono text-[10px] tabular-nums text-primary-foreground/70">
        {fecha}
      </p>
      {Number(ev.monto) > 0 && (
        <p className="font-mono text-[10px] tabular-nums">
          {formatMoney(ev.monto)}
        </p>
      )}
      {ev.folio && (
        <p className="font-mono text-[10px] text-primary-foreground/70">
          Folio {ev.folio}
        </p>
      )}
      {ev.tipo === "venta_credito" && ev.plazoMeses > 0 && (
        <p className="font-mono text-[10px] text-primary-foreground/70">
          {ev.plazoMeses} meses
        </p>
      )}
    </div>
  );
}

// EventIcon renders a single event marker wrapped in a hover info card. When the
// event maps to a sale (doctoPvId > 0) it stays clickable to open the venta.
function EventIcon({
  ev,
  size,
  onVentaClick,
}: {
  ev: EventoRitmo;
  size: number;
  onVentaClick?: (doctoPvId: number) => void;
}) {
  const { Icon, cls, label } = EVENT_META[ev.tipo];
  const trigger =
    ev.doctoPvId > 0 ? (
      <button
        type="button"
        onClick={() => onVentaClick?.(ev.doctoPvId)}
        aria-label={`Ver venta ${ev.folio}`}
        className="cursor-pointer focus:outline-none"
      >
        <Icon size={size} className={cls} />
      </button>
    ) : (
      <Icon size={size} className={cls} aria-label={label} />
    );
  return (
    <UITooltip>
      <UITooltipTrigger asChild>{trigger}</UITooltipTrigger>
      <UITooltipContent side="top">
        <EventInfoCard ev={ev} />
      </UITooltipContent>
    </UITooltip>
  );
}

// ─── Mini-picker popover ──────────────────────────────────────────────────────

// Per-venta accent palette — distinct hues, clear of all categoría hues:
// avoid 142±20 (green/pago), 217±20 (blue/enganche), 263±20 (violet/condonacion),
// 0±20 or 360±20 (red/perdida), near-zero-sat (neutral/otro).
const VENTA_ACCENT_PALETTE = [
  "hsl(197 90% 50%)",   // cyan
  "hsl(35 95% 55%)",    // amber-orange
  "hsl(168 80% 42%)",   // teal
  "hsl(330 85% 60%)",   // rose
  "hsl(85 75% 45%)",    // lime
  "hsl(290 75% 60%)",   // fuchsia
] as const;

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

  // Group pagos by doctoPvId, preserving order of first appearance
  const ventaOrder: number[] = [];
  const byVenta = new Map<number, PagoRitmo[]>();
  for (const pago of anchor.pagos) {
    if (!byVenta.has(pago.doctoPvId)) {
      byVenta.set(pago.doctoPvId, []);
      ventaOrder.push(pago.doctoPvId);
    }
    byVenta.get(pago.doctoPvId)!.push(pago);
  }

  // Assign a palette color to each distinct doctoPvId
  const ventaColor = new Map<number, string>();
  ventaOrder.forEach((id, idx) => {
    ventaColor.set(id, VENTA_ACCENT_PALETTE[idx % VENTA_ACCENT_PALETTE.length]);
  });

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label="Seleccionar pago"
      style={{ position: "fixed", left: anchor.x + 8, top: anchor.y + 8, zIndex: 50 }}
      className="min-w-[220px] rounded border border-border bg-popover shadow-md py-1"
    >
      {ventaOrder.map((doctoPvId) => {
        const pagos = byVenta.get(doctoPvId)!;
        const accent = ventaColor.get(doctoPvId)!;
        // Use the first pago's articulo/folio for the group header
        const firstPago = pagos[0];
        const headerLabel = firstPago.articulo
          ? `${firstPago.articulo} · ${firstPago.folio}`
          : firstPago.folio;

        return (
          <div key={doctoPvId} data-docto-pv-id={doctoPvId}>
            {/* Group header: accent bar + articulo + folio */}
            <div
              role="group"
              className="flex items-center gap-2 px-3 pt-2 pb-1"
              aria-label={headerLabel}
            >
              <span
                className="h-3.5 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
                data-venta-accent={doctoPvId}
              />
              <span className="truncate font-mono text-[10px] font-semibold text-foreground max-w-[160px]">
                {firstPago.articulo ? firstPago.articulo : firstPago.folio}
              </span>
              {firstPago.articulo && (
                <span className="ml-auto font-mono text-[9px] text-muted-foreground/60 shrink-0">
                  {firstPago.folio}
                </span>
              )}
            </div>

            {/* Pagos rows */}
            {pagos.map((pago) => {
              const meta = categoriaMeta(pago.categoria);
              const fecha = pago.fecha.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
              });
              const hora = pago.hora.slice(0, 5);
              return (
                <button
                  key={pago.doctoCcId}
                  role="option"
                  aria-selected={false}
                  type="button"
                  className="flex w-full flex-col gap-0.5 pl-6 pr-3 py-1.5 text-left hover:bg-muted focus:bg-muted focus:outline-none"
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
                    <span className="ml-auto font-mono text-[11px] tabular-nums text-foreground">
                      {formatMoney(pago.importe)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
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
                      {evts.map((ev, i) => (
                        <EventIcon
                          key={i}
                          ev={ev}
                          size={10}
                          onVentaClick={onVentaClick}
                        />
                      ))}
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
  // Group all semanas by year, then by month within each year
  const byYear = new Map<number, SemanaRitmo[]>();
  for (const s of semanas) {
    const y = s.semanaInicio.getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(s);
  }

  const years = Array.from(byYear.entries()).sort(([a], [b]) => a - b);

  return (
    // Single horizontal scroll for the whole history: one scrollbar at the
    // bottom, shown only when the widest year doesn't fit (no per-year bars).
    <div className="border-t border-dashed border-border/40 pt-3 mt-3 overflow-x-auto">
      <div className="flex flex-col gap-5 min-w-max">
      {years.map(([year, ySemanas]) => {
        const monthGroups = groupByMonth(ySemanas);
        return (
          <div key={year} className="flex flex-col gap-1">
            {/* Year heading on top (not inline) so it doesn't add to the row
                width — keeps each year the same width budget as the main
                heatmap, which fits at 22px without horizontal scroll. */}
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
              {year}
            </span>
            {/* Same interactive cells as the main heatmap (big + clickable);
                gap-1 between month groups matches the main's month spacing. */}
            <div className="flex gap-1">
                {monthGroups.map((g) => (
                  <div key={g.key} className="flex flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/40">
                      {g.label.split(" ")[0]}
                    </span>
                    {/* Icon lane */}
                    <div className="flex gap-[2px]">
                      {g.semanas.map((s) => {
                        const evts = eventsForWeek(eventos, s);
                        return (
                          <div
                            key={s.semanaInicio.getTime()}
                            style={{ width: HEATMAP_CELL_SIZE, height: 14 }}
                            className="flex items-center justify-center"
                          >
                            {evts.length > 0 && (
                              <div
                                className="flex gap-px"
                                aria-label={evts.map(ev => EVENT_META[ev.tipo].label).join(", ")}
                              >
                                {evts.map((ev, i) => (
                                  <EventIcon
                                    key={i}
                                    ev={ev}
                                    size={10}
                                    onVentaClick={onVentaClick}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Cells — reuse HeatmapCell: big, franjas + count, clickable */}
                    <div className="flex gap-[2px]">
                      {g.semanas.map((s) => (
                        <HeatmapCell
                          key={s.semanaInicio.getTime()}
                          semana={s}
                          cellSize={HEATMAP_CELL_SIZE}
                          maxMonto={maxMonto}
                          onHover={onHover}
                          onLeave={onLeave}
                          onPagoClick={onPagoClick}
                          onPickerOpen={onPickerOpen}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        );
      })}
      </div>
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
                      {evts.map((ev, i) => (
                        <EventIcon
                          key={i}
                          ev={ev}
                          size={7}
                          onVentaClick={onVentaClick}
                        />
                      ))}
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
  // ABONADO y AJUSTES vienen del dominio (backend ya discrimina por es_ingreso).
  const totalAbonado = Number(resumen.totalAbonado);
  const totalPerdonado = Number(resumen.totalPerdonado);

  // Semanas ACTIVAS = semanas en que el cliente tenía saldo por pagar (o pagó).
  // Esto excluye los periodos sin deuda (ya liquidado / antes de su compra), para
  // no castigar la constancia por semanas en las que no tenía obligación de pagar.
  const semanasActivas = semanas.filter(
    s => Number(s.saldo) > 0 || Number(s.montoAbonado) > 0,
  ).length;

  // ABONÓ EN / CONSTANCIA se miden sobre las semanas activas (mismo denominador).
  // Income-based: only weeks where the client made a real payment (not condonación/pérdida).
  const semanasConPago = semanas.filter(
    s => s.pagos.some(p => esCategoriaIngreso(p.categoria)),
  ).length;

  // RACHA ACTUAL: semanas consecutivas con ingreso real desde el FINAL de la ventana.
  let racha = 0;
  for (let i = semanas.length - 1; i >= 0; i--) {
    if (semanas[i].pagos.some(p => esCategoriaIngreso(p.categoria))) racha++;
    else break;
  }

  const constancia =
    semanasActivas > 0 ? Math.round((semanasConPago / semanasActivas) * 100) : 0;

  const stats: { label: string; value: string; unit?: string; hint?: string }[] = [
    {
      label: "ABONADO 12M",
      value: formatMoneyCompact(totalAbonado),
    },
    {
      label: "AJUSTES",
      value: formatMoneyCompact(totalPerdonado),
      hint: "Monto que bajó el saldo sin ser dinero real (condonaciones, descuentos, correcciones).",
    },
    {
      label: "ABONÓ EN",
      value: String(semanasConPago),
      unit: `/${semanasActivas} sem`,
      hint: "Semanas en que abonó, de las semanas con deuda.",
    },
    {
      label: "RACHA ACTUAL",
      value: String(racha),
      unit: " sem",
      hint: "Semanas seguidas pagando hasta hoy.",
    },
    {
      label: "CONSTANCIA",
      value: `${constancia}%`,
      hint: "% de semanas con deuda en las que sí abonó.",
    },
  ];
  if (pulso) {
    stats.push(
      { label: "CADENCIA", value: String(pulso.cadenciaDias), unit: " días", hint: "Cada cuántos días suele pagar, en promedio." },
      { label: "ATRASO PROM", value: String(pulso.diasAtrasoProm), unit: " días", hint: "Días promedio que se atrasa respecto a su cadencia." },
    );
  }

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {stats.map(({ label, value, unit, hint }) => (
        <div key={label} className="flex flex-col">
          <span className="inline-flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
            {label}
            {hint && <InfoHint text={hint} label={label} />}
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

  // useLayoutEffect (not useEffect): measure the real container width BEFORE the
  // browser paints, so the fluid cellSize never renders at the 800px placeholder
  // (which yields tiny ~11px cells for 52 weeks). Otherwise every mount/HMR shows
  // a one-frame "shrunk" heatmap until the post-paint effect corrects it.
  useLayoutEffect(() => {
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

  // Fixed cell size (not fluid). The old fluid sizing divided the MEASURED
  // container width among the weeks; when the width measurement glitched to its
  // 800px fallback (ref null at effect time / HMR re-mount), cells shrank to the
  // ~11px floor and stayed there ("a veces chico"). A constant size + the
  // existing overflow-x-auto (scroll when it doesn't fit) is always consistent.
  const cellSize = HEATMAP_CELL_SIZE;

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
    <UITooltipProvider delayDuration={200}>
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
          onHover={handleCellHover}
          onLeave={handleCellLeave}
          onVentaClick={onVentaClick}
          onPagoClick={onPagoClick}
          onPickerOpen={handlePickerOpen}
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
    </UITooltipProvider>
  );
}
