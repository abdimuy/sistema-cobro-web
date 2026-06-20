import type { ElementType } from "react";
import { Banknote, CircleCheck, CreditCard } from "lucide-react";
import type { EventoRitmo, EventoTipo, SemanaRitmo } from "../../../domain/entities/RitmoPago";

// ─── Constants ────────────────────────────────────────────────────────────────

export const MONTH_NAMES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"] as const;
const WEEKS_DEFAULT = 52;
export const GAP = 2;    // px gap between cells within a group
export const MONTH_SEP = 4; // px spacer between month groups

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function weekMs(d: Date): number {
  return d.getTime() + 7 * 24 * 60 * 60 * 1000;
}

export function isCurrentWeek(semana: SemanaRitmo): boolean {
  const now = Date.now();
  return now >= semana.semanaInicio.getTime() && now < weekMs(semana.semanaInicio);
}

export function eventsForWeek(eventos: EventoRitmo[], semana: SemanaRitmo): EventoRitmo[] {
  const start = semana.semanaInicio.getTime();
  const end = weekMs(semana.semanaInicio);
  return eventos.filter(e => e.fecha.getTime() >= start && e.fecha.getTime() < end);
}

export function groupByMonth(semanas: SemanaRitmo[]): { key: string; label: string; semanas: SemanaRitmo[] }[] {
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

export function monthSubtotal(semanas: SemanaRitmo[]): number {
  return semanas.reduce((acc, s) => acc + Number(s.montoAbonado), 0);
}

/** Returns max non-zero montoAbonado across all semanas (stable — uses full dataset). */
export function computeMaxMonto(semanas: SemanaRitmo[]): number {
  let max = 0;
  for (const s of semanas) {
    const m = Number(s.montoAbonado);
    if (m > max) max = m;
  }
  return max;
}

/** Returns the last 52 weeks ending at today (i.e. the tail of the backend array). */
export function defaultWindow(semanas: SemanaRitmo[]): SemanaRitmo[] {
  return semanas.slice(-WEEKS_DEFAULT);
}

/** Format a number as compact money: $X.Xk */
export function formatMoneyCompact(monto: number): string {
  if (monto <= 0) return "$0";
  const k = monto / 1000;
  return `$${k.toFixed(1)}k`;
}

// ─── Cell intensity (relative) ────────────────────────────────────────────────

export function cellClass(monto: number, maxMonto: number): string {
  if (monto <= 0 || maxMonto <= 0) return "bg-muted";
  if (monto <= maxMonto * 0.25)    return "[background:hsl(140,45%,78%)] dark:[background:hsl(143,28%,24%)]";
  if (monto <= maxMonto * 0.50)    return "[background:hsl(143,50%,57%)] dark:[background:hsl(144,42%,35%)]";
  if (monto <= maxMonto * 0.75)    return "[background:hsl(146,62%,38%)] dark:[background:hsl(145,58%,47%)]";
  return "[background:hsl(150,78%,24%)] dark:[background:hsl(145,72%,62%)]";
}

// ─── Event icon ───────────────────────────────────────────────────────────────

export const EVENT_META: Record<EventoTipo, { Icon: ElementType; cls: string; label: string }> = {
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

export type TooltipState = {
  x: number;
  y: number;
  semana: SemanaRitmo;
} | null;
