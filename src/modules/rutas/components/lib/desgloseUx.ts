import type { VentaCobranza } from "../../domain/entities";

// Semaphore classification for a venta row in the desglose.
// Based on the coverage of the weekly cuota (aporte) for ventas that aplican.
//   green  (emerald): aporte >= 1  (cubrió su cuota o más)
//   amber          : 0 < aporte < 1 (parcial)
//   red            : aporte == 0    (no pagó)
// Ventas que no aplican esta semana → neutral (de-emphasized).
export type SemaphoreLevel = "green" | "amber" | "red" | "neutral";

export type SemaphoreConfig = {
  level: SemaphoreLevel;
  label: string;
  // Tailwind tokens matching the existing badge visual language.
  bg: string;
  text: string;
  border: string;
  dot: string;
  // Accent classes for the inline aporte bar fill / row rail.
  fill: string;
  rail: string;
};

const SEMAPHORE: Record<SemaphoreLevel, Omit<SemaphoreConfig, "level">> = {
  green: {
    label: "Cubrió",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    fill: "bg-emerald-500",
    rail: "bg-emerald-500/60",
  },
  amber: {
    label: "Parcial",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    fill: "bg-amber-500",
    rail: "bg-amber-500/60",
  },
  red: {
    label: "Sin pago",
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/20",
    dot: "bg-red-500",
    fill: "bg-red-500",
    rail: "bg-red-500/60",
  },
  neutral: {
    label: "No aplica",
    bg: "bg-muted/40",
    text: "text-muted-foreground",
    border: "border-border/60",
    dot: "bg-muted-foreground/50",
    fill: "bg-muted-foreground/40",
    rail: "bg-border/60",
  },
};

/** Classify a venta into a semaphore level. */
export function semaphoreLevel(venta: VentaCobranza): SemaphoreLevel {
  if (!venta.aplicaPonderado) return "neutral";
  const aporte = Number(venta.aporte);
  if (!Number.isFinite(aporte) || aporte <= 0) return "red";
  if (aporte >= 1) return "green";
  return "amber";
}

/** Full visual config (colors + label) for a venta's semaphore. */
export function semaphoreConfig(venta: VentaCobranza): SemaphoreConfig {
  const level = semaphoreLevel(venta);
  return { level, ...SEMAPHORE[level] };
}

/** Proportion (0..1) of the weekly cuota covered by aporte, clamped to [0,1]. */
export function aporteFillRatio(aporteRaw: string): number {
  const n = Number(aporteRaw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, 1);
}

/** Catch-up multiplier label when aporte > 1 (e.g. "×2" for 2 cuotas). null otherwise. */
export function catchUpMarker(aporteRaw: string): string | null {
  const n = Number(aporteRaw);
  if (!Number.isFinite(n) || n <= 1) return null;
  return `×${Number.isInteger(n) ? n : parseFloat(n.toFixed(1))}`;
}

/** Bar fill width as a 0..100 number for a pct string (display-only). */
export function pctBarWidth(pctRaw: string | null): number {
  if (pctRaw === null) return 0;
  const n = Number(pctRaw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, 100);
}

/** Overflow marker "+X%" when pct > 100. null otherwise. */
export function pctOverflowMarker(pctRaw: string | null): string | null {
  if (pctRaw === null) return null;
  const n = Number(pctRaw);
  if (!Number.isFinite(n) || n <= 100) return null;
  return `+${Math.round(n - 100)}%`;
}

const SHORT_DATE = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
});

/** Format an RFC3339 date as "desde DD-mmm" (e.g. "desde 16-jun"). */
export function formatVentanaDesde(rfc3339: string): string {
  const d = new Date(rfc3339);
  if (Number.isNaN(d.getTime())) return rfc3339;
  return `desde ${SHORT_DATE.format(d).replace(/\s/g, "-").replace(".", "")}`;
}

/** Day count since the given RFC3339 date relative to `now` (e.g. "hace 6 d"). */
export function formatVentanaDias(rfc3339: string, now: Date = new Date()): string {
  const d = new Date(rfc3339);
  if (Number.isNaN(d.getTime())) return "";
  const ms = now.getTime() - d.getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  return `hace ${days} d`;
}
