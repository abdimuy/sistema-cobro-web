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

/** Format a decimal string as a percentage (e.g. "78.5" → "78.5%"). Null → "—". */
export function formatPct(raw: string | null): string {
  if (raw === null) return "—";
  return `${Number(raw).toFixed(1)}%`;
}

/** Cuotas sin ceros de relleno: "43.0000"→"43", "0.8500"→"0.85", "2.5000"→"2.5". */
export function formatCuotas(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
}

/** MXN sin centavos: "8600.00"→"$8,600". */
const MXN_SHORT = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });
export function formatMoneyShort(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return MXN_SHORT.format(n);
}
