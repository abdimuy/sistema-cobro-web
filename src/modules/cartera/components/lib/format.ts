// Display-only formatting helpers for the cartera module.
// Money arrives as decimal strings; ratios (PAR, CEI, margen) arrive as
// strings in [0,1]. Keep parsing/formatting here so components stay declarative.

const MXN_FORMAT = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format a decimal string as compact MXN (e.g. "500000.00" → "$500,000"). */
export function formatMoney(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return MXN_FORMAT.format(n);
}

/**
 * Format a ratio string already in the 0–1 range as a percentage with up to
 * 2 decimal places and no trailing zeros (e.g. "0.1523" → "15.23%",
 * "0.15" → "15%", "0.1" → "10%"). Used for PAR, CEI and margen real proxy.
 */
export function formatRatioPct(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  const pct = (n * 100).toFixed(2).replace(/\.?0+$/, "");
  return `${pct}%`;
}

/** Format a signed ratio as a percentage with sign (e.g. 0.08 → "+8%"). */
export function formatSignedPct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const pct = Math.round(value * 100);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}
