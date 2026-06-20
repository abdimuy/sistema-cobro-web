import type { ElementType } from "react";
import { Banknote, CircleCheck, CreditCard } from "lucide-react";
import type { EventoRitmo, EventoTipo, SemanaRitmo } from "../../../domain/entities/RitmoPago";
import type { CategoriaPago } from "../../../domain/values/CategoriaPago";

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

// ─── Category helpers ─────────────────────────────────────────────────────────

/** Returns true for income categories (everything except condonacion and perdida). */
export function esCategoriaIngreso(cat: CategoriaPago): boolean {
  return cat !== "condonacion" && cat !== "perdida";
}

/** Returns the dominant category by summed importe. On tie, income beats non-income. */
export function dominantCategoria(
  movs: { categoria: CategoriaPago; importe: number }[],
): CategoriaPago | null {
  if (movs.length === 0) return null;
  const sums = new Map<CategoriaPago, number>();
  for (const m of movs) {
    sums.set(m.categoria, (sums.get(m.categoria) ?? 0) + m.importe);
  }
  let bestCat: CategoriaPago | null = null;
  let bestAmt = -Infinity;
  for (const [cat, amt] of sums.entries()) {
    const wins =
      amt > bestAmt ||
      (amt === bestAmt &&
        esCategoriaIngreso(cat) &&
        bestCat !== null &&
        !esCategoriaIngreso(bestCat));
    if (wins) {
      bestCat = cat;
      bestAmt = amt;
    }
  }
  return bestCat;
}

// ─── Event icon ───────────────────────────────────────────────────────────────

// Event icons are intentionally NEUTRAL: the icon SHAPE carries the meaning
// (card = crédito, bill = contado, check = liquidación). Color is reserved
// exclusively for payment categories (pago/enganche/condonación/pérdida), so on
// this analysis page each hue means exactly one thing. Borrowing a category hue
// here would make blue/violet/green ambiguous.
const EVENT_ICON_CLS = "text-foreground/70";

export const EVENT_META: Record<EventoTipo, { Icon: ElementType; cls: string; label: string }> = {
  venta_credito: {
    Icon: CreditCard,
    cls: EVENT_ICON_CLS,
    label: "Venta crédito",
  },
  venta_contado: {
    Icon: Banknote,
    cls: EVENT_ICON_CLS,
    label: "Venta contado",
  },
  liquidacion: {
    Icon: CircleCheck,
    cls: EVENT_ICON_CLS,
    label: "Liquidación",
  },
};

// ─── Tooltip state ────────────────────────────────────────────────────────────

export type TooltipState = {
  x: number;
  y: number;
  semana: SemanaRitmo;
} | null;
