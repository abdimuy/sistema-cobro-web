// Shared formatting utilities for the clientes module.
// All monetary values are decimal strings — use these helpers for display only.

const MXN_FORMAT = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MXN_FORMAT_SHORT = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format a decimal string as MXN currency (e.g. "18500.00" → "$18,500.00"). */
export function formatMoney(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return MXN_FORMAT.format(n);
}

/** Format a decimal string as MXN with no fractional digits (for compact display). */
export function formatMoneyShort(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return MXN_FORMAT_SHORT.format(n);
}

/** Convert a decimal pct string (e.g. "0.93") to a display string ("93%"). */
export function formatPct(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return `${(n * 100).toFixed(0)}%`;
}
