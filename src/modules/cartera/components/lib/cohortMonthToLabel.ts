// cohortMonthToLabel converts a packed cohort_month integer to a short Spanish
// month label. The server encodes cohort months as year×12 + month (1-indexed):
//
//   cohortMonth = year * 12 + month   (month ∈ [1,12])
//
// Inverse:
//   year  = Math.floor((n - 1) / 12)
//   month = ((n - 1) % 12) + 1
//
// Example: 24318 → floor(24317/12)=2026, (24317%12)+1=6 → "Jun 2026"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] as const;

export function cohortMonthToLabel(n: number): string {
  const year = Math.floor((n - 1) / 12);
  const month = ((n - 1) % 12) + 1; // 1-indexed
  return `${MESES[month - 1]} ${year}`;
}
