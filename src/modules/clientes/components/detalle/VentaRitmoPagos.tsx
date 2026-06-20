import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { VentaCliente } from "../../domain/entities/VentaCliente";
import type { ContratoCredito } from "../../domain/entities/VentaDetalle";
import type { Pago } from "../../domain/entities/Pago";
import type { CategoriaPago } from "../../domain/values/CategoriaPago";
import { categoriaMeta } from "../lib/pagoConcepto";
import { formatMoney } from "../lib/format";
import {
  computeMaxMonto,
  dominantCategoria,
  esCategoriaIngreso,
  groupByMonth,
  formatMoneyCompact,
  GAP,
  MONTH_SEP,
  MONTH_NAMES,
  type TooltipState,
} from "../ficha/lib/heatmapHelpers";
import { CellBands, SaldoSvg, Tooltip } from "../ficha/lib/HeatmapPrimitives";

// ─── Local types ──────────────────────────────────────────────────────────────

type SyntheticPago = {
  doctoCcId: null;
  fecha: Date;
  importe: string;
  concepto: string;
  categoria: CategoriaPago;
  esIngreso: true;
};

type AnyPago = Pago | SyntheticPago;

type VentaSemana = {
  semanaInicio: Date;
  montoAbonado: string;
  saldo: string;
  numPagos: number;
  // pagos satisfies SemanaRitmo contract; VentaRitmoPagos uses doctoCcIds/categoriaSums instead.
  pagos: [];
  categoriaSums: Partial<Record<CategoriaPago, number>>;
  doctoCcIds: number[];
  movimientos: { categoria: CategoriaPago; importe: number }[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL_SIZE = 14;

const LEGEND_CATS: CategoriaPago[] = ["pago", "enganche", "condonacion", "perdida"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function floorToWeekStartMs(ms: number): number {
  const d = new Date(ms);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysToMon = day === 0 ? 6 : day - 1;
  return (
    ms -
    daysToMon * 24 * 60 * 60 * 1000 -
    (d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()) * 1000 -
    d.getUTCMilliseconds()
  );
}

function buildVentaSemanas(
  venta: VentaCliente,
  pagos: Pago[],
  contrato: ContratoCredito | null,
): VentaSemana[] {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  // Enganche synthesis: if contrato.enganche > 0 AND no pago has categoria === "enganche"
  const allMovements: AnyPago[] = [...pagos];
  if (
    Number(contrato?.enganche ?? 0) > 0 &&
    !pagos.some((p) => p.categoria === "enganche")
  ) {
    const synth: SyntheticPago = {
      doctoCcId: null,
      fecha: venta.fecha,
      importe: contrato!.enganche,
      concepto: "Enganche",
      categoria: "enganche",
      esIngreso: true,
    };
    allMovements.push(synth);
  }

  // Window start = week-start of venta.fecha
  const windowStartMs = floorToWeekStartMs(venta.fecha.getTime());

  // Window end = if saldoVenta===0, week of last movement; else current week
  const isLiquidada = Number(venta.saldoVenta) === 0;
  let windowEndMs: number;
  if (isLiquidada && allMovements.length > 0) {
    const lastMovMs = Math.max(...allMovements.map((m) => m.fecha.getTime()));
    windowEndMs = floorToWeekStartMs(lastMovMs);
  } else {
    windowEndMs = floorToWeekStartMs(Date.now());
  }

  // Build weekly buckets
  const rawWeeks = Math.round((windowEndMs - windowStartMs) / WEEK_MS) + 1;
  const numWeeks = Math.max(1, Math.min(rawWeeks, 260));

  const buckets: VentaSemana[] = Array.from({ length: numWeeks }, (_, i) => ({
    semanaInicio: new Date(windowStartMs + i * WEEK_MS),
    montoAbonado: "0.00",
    saldo: "0.00",
    numPagos: 0,
    pagos: [],
    categoriaSums: {},
    doctoCcIds: [],
    movimientos: [],
  }));

  // Bucket movements
  for (const m of allMovements) {
    const idx = Math.floor((m.fecha.getTime() - windowStartMs) / WEEK_MS);
    if (idx < 0 || idx >= buckets.length) continue;
    const b = buckets[idx];
    const amount = Number(m.importe);
    b.montoAbonado = (Number(b.montoAbonado) + amount).toFixed(2);
    b.numPagos++;
    b.categoriaSums[m.categoria] = (b.categoriaSums[m.categoria] ?? 0) + amount;
    b.movimientos.push({ categoria: m.categoria, importe: amount });
    if (m.doctoCcId !== null) {
      b.doctoCcIds.push(m.doctoCcId as number);
    }
  }

  // Saldo reconstruction
  let saldo = Number(venta.total);
  for (const b of buckets) {
    saldo = Math.max(0, saldo - Number(b.montoAbonado));
    b.saldo = saldo.toFixed(2);
  }
  // Pin final week to venta.saldoVenta
  if (buckets.length > 0) {
    buckets[buckets.length - 1].saldo = venta.saldoVenta;
  }

  return buckets;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
        {label}
      </span>
      <span className="font-serif text-[22px] leading-none text-foreground">
        {value}
        {unit && (
          <small className="font-mono text-[10px] text-muted-foreground/70">
            {unit}
          </small>
        )}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  venta: VentaCliente;
  pagos: Pago[];
  contrato: ContratoCredito | null;
  onPagoClick?: (doctoCcId: number) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VentaRitmoPagos({ venta, pagos, contrato, onPagoClick }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [pickerAnchor, setPickerAnchor] = useState<{
    weekMs: number;
    x: number;
    y: number;
  } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const ventaSemanas = useMemo(
    () => buildVentaSemanas(venta, pagos, contrato),
    [venta, pagos, contrato],
  );

  // Index by timestamp for O(1) lookup inside cell render (groupByMonth loses extra fields)
  const semanaByMs = useMemo(() => {
    const m = new Map<number, VentaSemana>();
    for (const s of ventaSemanas) m.set(s.semanaInicio.getTime(), s);
    return m;
  }, [ventaSemanas]);

  // Close picker on Escape
  useEffect(() => {
    if (!pickerAnchor) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerAnchor(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerAnchor]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerAnchor) return;
    function onMouseDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerAnchor(null);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [pickerAnchor]);

  if (ventaSemanas.length === 0) return null;

  const maxMonto = computeMaxMonto(ventaSemanas);
  const monthGroups = groupByMonth(ventaSemanas);

  // Summary stats
  // ABONADO = income only (esCategoriaIngreso excludes condonacion/perdida)
  const totalAbonado = ventaSemanas.reduce((acc, s) => {
    const ingresoSum = (
      Object.entries(s.categoriaSums) as [CategoriaPago, number][]
    ).reduce((sum, [cat, amt]) => (esCategoriaIngreso(cat) ? sum + amt : sum), 0);
    return acc + ingresoSum;
  }, 0);

  // PERDÓN = condonacion + perdida
  const totalPerdonado = ventaSemanas.reduce((acc, s) => {
    const perdonSum = (
      Object.entries(s.categoriaSums) as [CategoriaPago, number][]
    ).reduce((sum, [cat, amt]) => (!esCategoriaIngreso(cat) ? sum + amt : sum), 0);
    return acc + perdonSum;
  }, 0);

  const pctLiquidado =
    Number(venta.total) > 0
      ? Math.round((1 - Number(venta.saldoVenta) / Number(venta.total)) * 100)
      : 0;

  let racha = 0;
  for (let i = ventaSemanas.length - 1; i >= 0; i--) {
    const s = ventaSemanas[i];
    const hasIncome = (
      Object.entries(s.categoriaSums) as [CategoriaPago, number][]
    ).some(([cat, amt]) => esCategoriaIngreso(cat) && amt > 0);
    if (hasIncome) racha++;
    else break;
  }

  function handleCellClick(semana: VentaSemana, e: React.MouseEvent) {
    if (semana.doctoCcIds.length === 0) return;
    if (semana.doctoCcIds.length === 1) {
      onPagoClick?.(semana.doctoCcIds[0]);
      return;
    }
    setPickerAnchor({
      weekMs: semana.semanaInicio.getTime(),
      x: e.clientX,
      y: e.clientY,
    });
  }

  // Active picker semana
  const pickerSemana = pickerAnchor
    ? ventaSemanas.find((s) => s.semanaInicio.getTime() === pickerAnchor.weekMs)
    : null;
  const pickerPagos = pickerSemana
    ? pagos.filter((p) => pickerSemana.doctoCcIds.includes(p.doctoCcId))
    : [];

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-serif text-lg font-normal text-foreground">
          Cadencia de pagos
        </h3>
      </div>

      {/* Summary strip */}
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
        <Stat label="ABONADO" value={formatMoneyCompact(totalAbonado)} />
        <Stat label="PERDÓN" value={formatMoneyCompact(totalPerdonado)} />
        <Stat
          label="SALDO"
          value={formatMoneyCompact(Number(venta.saldoVenta))}
        />
        <Stat label="LIQUIDADO" value={`${pctLiquidado}%`} />
        <Stat label="RACHA" value={String(racha)} unit=" sem" />
      </div>

      {/* Heatmap + saldo curve */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels — absolutely positioned at each month's exact
              first-cell x offset (same math as the cells row below), so a label
              always sits over its own month. Single-week partial months at the
              window edges are skipped (no room for a label); the year is shown
              only at year boundaries. A light collision guard prevents overlap. */}
          {(() => {
            const CHAR_PX = 6.3; // ~width per char of the 9px mono label
            const placed: { key: string; x: number; text: string }[] = [];
            let x = 0;
            let lastRight = -Infinity;
            monthGroups.forEach((g, gi) => {
              const n = g.semanas.length;
              const groupWidth = n * CELL_SIZE + (n - 1) * GAP;
              if (n >= 2) {
                const d = g.semanas[0].semanaInicio;
                const yearMark = gi === 0 || d.getMonth() === 0;
                const text = yearMark
                  ? `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
                  : MONTH_NAMES[d.getMonth()];
                if (x >= lastRight + 3) {
                  placed.push({ key: g.key, x, text });
                  lastRight = x + text.length * CHAR_PX;
                }
              }
              // advance to the next group's first-cell x (matches the cells row:
              // group wrapper width = cells + inter-cell gaps + gap + separator)
              if (gi < monthGroups.length - 1) x += groupWidth + GAP + MONTH_SEP;
            });
            const totalWidth = x;
            return (
              <div className="relative h-3" style={{ width: totalWidth }}>
                {placed.map((l) => (
                  <span
                    key={l.key}
                    className="absolute top-0 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60"
                    style={{ left: l.x }}
                  >
                    {l.text}
                  </span>
                ))}
              </div>
            );
          })()}

          {/* Cells */}
          <div className="flex items-center">
            {monthGroups.map((g, gi) => (
              <div key={g.key} className="flex gap-[2px]">
                {g.semanas.map((s) => {
                  const vs = semanaByMs.get(s.semanaInicio.getTime())!;
                  const monto = Number(vs.montoAbonado);
                  const isClickable = vs.doctoCcIds.length > 0;
                  const isActive = monto > 0 && maxMonto > 0;
                  const dominantCat = dominantCategoria(vs.movimientos) ?? "otro";

                  const dateStr = vs.semanaInicio.toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const ariaLabel = isActive
                    ? `Semana ${dateStr} — ${formatMoney(vs.montoAbonado)} (${dominantCat})`
                    : `Semana ${dateStr} — Sin pago`;

                  return (
                    <button
                      key={vs.semanaInicio.getTime()}
                      type="button"
                      disabled={!isClickable}
                      data-testid={
                        vs.doctoCcIds.length === 1
                          ? `cell-pago-${vs.doctoCcIds[0]}`
                          : undefined
                      }
                      style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      className={[
                        "transition-transform",
                        isClickable
                          ? "cursor-pointer hover:scale-125"
                          : "cursor-default",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onMouseMove={(e) =>
                        isActive
                          ? setTooltip({ x: e.clientX, y: e.clientY, semana: vs })
                          : undefined
                      }
                      onMouseLeave={() => setTooltip(null)}
                      onClick={(e) => handleCellClick(vs, e)}
                      aria-label={ariaLabel}
                    >
                      <CellBands
                        movimientos={vs.movimientos}
                        weekMonto={monto}
                        maxMonto={maxMonto}
                        size={CELL_SIZE}
                      />
                    </button>
                  );
                })}
                {gi < monthGroups.length - 1 && (
                  <div style={{ width: MONTH_SEP }} />
                )}
              </div>
            ))}
          </div>

          {/* Saldo curve */}
          <SaldoSvg
            semanas={ventaSemanas}
            cellSize={CELL_SIZE}
            monthGroups={monthGroups}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {LEGEND_CATS.map((cat) => {
          const m = categoriaMeta(cat);
          return (
            <span key={cat} className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${m.dotClass}`}
              />
              <span className="font-mono text-[10px] text-muted-foreground">
                {m.label}
              </span>
            </span>
          );
        })}
      </div>

      {/* Tooltip */}
      <Tooltip tooltip={tooltip} />

      {/* Mini-picker — portaled to <body> so `position: fixed` is viewport-
          relative (the modal's transform would otherwise offset it). */}
      {pickerAnchor &&
        pickerPagos.length > 0 &&
        createPortal(
        <div
          ref={pickerRef}
          className="fixed z-[100] rounded-md border border-border bg-background shadow-lg py-1 min-w-[160px]"
          style={{ left: pickerAnchor.x, top: pickerAnchor.y }}
          role="listbox"
          aria-label="Seleccionar pago"
        >
          {pickerPagos.map((p) => {
            const m = categoriaMeta(p.categoria);
            return (
              <button
                key={p.doctoCcId}
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/40"
                onClick={() => {
                  setPickerAnchor(null);
                  onPagoClick?.(p.doctoCcId);
                }}
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${m.dotClass}`}
                />
                <span className="font-mono truncate">{p.concepto}</span>
                <span className="ml-auto font-mono tabular-nums text-muted-foreground">
                  {formatMoney(p.importe)}
                </span>
              </button>
            );
          })}
        </div>,
          document.body,
        )}
    </section>
  );
}

export default VentaRitmoPagos;
