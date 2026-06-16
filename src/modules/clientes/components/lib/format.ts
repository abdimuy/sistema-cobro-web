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

/**
 * Format a percentage string ALREADY in the 0–100 range (e.g. "93.45" → "93%").
 * The API sends every percentage as 0–100 (pct_liquidado = abonado/comprado*100,
 * por_liquidar_pct as NUMERIC(5,2) 0–100), so this must NOT multiply by 100.
 */
export function formatPct(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return `${n.toFixed(0)}%`;
}
