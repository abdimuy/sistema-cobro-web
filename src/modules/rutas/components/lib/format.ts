// Shared formatting utilities for the rutas module.
// All monetary values are decimal strings — use these helpers for display only.

const MXN_FORMAT = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a decimal string as MXN currency (e.g. "125000.00" → "$125,000.00"). */
export function formatMoney(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return MXN_FORMAT.format(n);
}
