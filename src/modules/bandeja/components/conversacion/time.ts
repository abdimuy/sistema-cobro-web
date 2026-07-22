// Small date helpers for the conversation thread. Deliberately independent
// of Intl/locale APIs (whose output can vary across CI/Node ICU builds) so
// tests stay deterministic — the thread only ever needs HH:mm and a
// handful of day labels.

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

// formatHM renders "HH:mm" in the viewer's local timezone.
export function formatHM(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// dayLabel renders the day separator for the thread (mockup `.daysep`):
// "Hoy" / "Ayer" / "21 jul" for anything older, compared against `now`
// (injectable for tests).
export function dayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const today = dayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const key = dayKey(d);
  if (key === today) return "Hoy";
  if (key === dayKey(yesterday)) return "Ayer";
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}
