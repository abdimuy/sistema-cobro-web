// Pure formatting helpers for WinbackItem display values.
// All functions are NaN-safe and return the raw input on parse failure.

const mxnFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateShortFmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Formats a decimal string as MXN with 0 fraction digits. Returns raw string if not parseable. */
export function formatMoney(raw: string): string {
  if (raw === "") return raw;
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return mxnFmt.format(n);
}

/**
 * Formats a decimal proportion string (e.g. "0.85") as an integer percentage
 * string (e.g. "85%"). Returns raw string if not parseable.
 */
export function formatPercent(raw: string): string {
  if (raw === "") return raw;
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return `${Math.round(n * 100)}%`;
}

/** Formats a Date as a short Spanish date (e.g. "14 jun 2026"). */
export function formatFecha(d: Date): string {
  return dateShortFmt.format(d);
}

/** Compact recencia label for table cells (e.g. "90 d"). */
export function formatRecencia(dias: number): string {
  return `${dias} d`;
}

/** Long recencia label for drawer/detail views (e.g. "90 días"). */
export function formatDiasLargo(dias: number): string {
  return `${dias} días`;
}
