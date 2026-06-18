/**
 * buildWhatsAppHref — strips all non-digit characters from a phone string,
 * then prepends the MX country code (52) if the number is a 10-digit local
 * number.
 *
 * Examples:
 *   "477 123 4567"      → "https://wa.me/524771234567"
 *   "+52 477 123 4567"  → "https://wa.me/524771234567"
 *   "521234567890"      → "https://wa.me/521234567890"
 */
export function buildWhatsAppHref(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const normalized = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${normalized}`;
}
