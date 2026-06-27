// Visual UX helpers for the cartera Resumen: KPI semáforos, aging bucket
// colors and deterioration thresholds. Token language mirrors rutas'
// `semaphoreConfig` (emerald/amber/red) so the dashboard reads consistently.

export type SemaphoreLevel = "green" | "amber" | "red" | "neutral";

export type SemaphoreTone = {
  text: string;
  dot: string;
};

const TONE: Record<SemaphoreLevel, SemaphoreTone> = {
  green: { text: "text-emerald-500", dot: "bg-emerald-500" },
  amber: { text: "text-amber-500", dot: "bg-amber-500" },
  red: { text: "text-red-500", dot: "bg-red-500" },
  neutral: { text: "text-muted-foreground", dot: "bg-muted-foreground/50" },
};

export function semaphoreTone(level: SemaphoreLevel): SemaphoreTone {
  return TONE[level];
}

// ---------------------------------------------------------------------------
// Thresholds (documented constants — the single source of truth for alerts).
// PAR (Portfolio At Risk): proportion of balance in mora. Lower is better.
// CEI (Collection Effectiveness Index): collection rate. Higher is better.
// ---------------------------------------------------------------------------

/** PAR at/above this ratio is a deterioration alert. */
export const PAR_ALERT_THRESHOLD = 0.2;
/** PAR at/above this ratio is amber (watch); below is green. */
export const PAR_WARN_THRESHOLD = 0.1;
/** CEI at/below this ratio is a deterioration alert. */
export const CEI_ALERT_THRESHOLD = 0.8;
/** CEI at/below this ratio is amber (watch); above is green. */
export const CEI_WARN_THRESHOLD = 0.9;

/** Semáforo for PAR (low=good). */
export function parLevel(par: string): SemaphoreLevel {
  const n = Number(par);
  if (!Number.isFinite(n)) return "neutral";
  if (n >= PAR_ALERT_THRESHOLD) return "red";
  if (n >= PAR_WARN_THRESHOLD) return "amber";
  return "green";
}

/** Semáforo for CEI (high=good). */
export function ceiLevel(cei: string): SemaphoreLevel {
  const n = Number(cei);
  if (!Number.isFinite(n)) return "neutral";
  if (n <= CEI_ALERT_THRESHOLD) return "red";
  if (n <= CEI_WARN_THRESHOLD) return "amber";
  return "green";
}

// ---------------------------------------------------------------------------
// Aging buckets — color escalates with delinquency (green → red).
// ---------------------------------------------------------------------------

export const AGING_BUCKET_ORDER = ["0-30", "31-60", "61-90", "90+"] as const;

export const AGING_BUCKET_COLOR: Record<string, string> = {
  "0-30": "hsl(160 84% 39%)", // emerald-500
  "31-60": "hsl(43 96% 56%)", // amber-400
  "61-90": "hsl(25 95% 53%)", // orange-500
  "90+": "hsl(0 84% 60%)", // red-500
};

/** Stable color for an aging bucket, defaulting to neutral when unknown. */
export function agingColor(bucket: string): string {
  return AGING_BUCKET_COLOR[bucket] ?? "hsl(215 16% 47%)";
}
