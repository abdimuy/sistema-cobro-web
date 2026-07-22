// Small, pure presentation helpers shared by the bandeja panels. No I/O, no
// framework — kept separate from domain/helpers.ts (Task 2) because these
// are purely about how we *render* a value, not what it *means*.

// initials extracts up to two initials from a full name for the avatar
// bubble (mockup `.av`), e.g. "MARÍA LÓPEZ HERNÁNDEZ" -> "ML".
export function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[1]?.[0] ?? "") : "";
  return `${first}${second}`.toUpperCase();
}

// maskTelefono renders a phone number with the middle digits hidden, e.g.
// "+52 238 000 4521" -> "+52 238 ••• 4521". Falls back to the raw value
// when it doesn't look like a 10-digit Mexican number (never fabricate
// digits that aren't there).
export function maskTelefono(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.length < 10) return tel;
  const local = digits.slice(-10);
  const cc = digits.slice(0, digits.length - 10) || "52";
  return `+${cc} ${local.slice(0, 3)} ••• ${local.slice(6)}`;
}

// formatElapsed renders a compact "time ago" label for the queue rows
// (mockup `.time`: "2 min", "1 h", "3 h" — never the verbose "hace X"
// phrasing dayjs' fromNow() produces). `now` is injectable for deterministic
// tests.
export function formatElapsed(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Math.max(0, now.getTime() - then);
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} d`;
}

// humanizeSnake turns a backend snake_case token (accion/intencion values
// like "ofrecer_comedor") into a short human phrase ("Ofrecer comedor").
export function humanizeSnake(s: string): string {
  const clean = s.trim();
  if (!clean) return "";
  const words = clean.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
