const cada30 = (desde: number, hasta: number) =>
  Array.from({ length: (hasta - desde) / 30 + 1 }, (_, i) => deMin(desde + i * 30));
function deMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
const aMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

// D21: pasos de 30 min; el servidor exige desde < hasta del mismo día.
export const INICIOS_HORARIO: readonly string[] = cada30(0, 23 * 60);
export const FINES_HORARIO: readonly string[] = [...cada30(30, 23 * 60 + 30), "23:59"];

// Si el inicio alcanza o pasa al fin, el fin se recorre a inicio + 1 h (máx. 23:59).
export function finTrasInicio(inicio: string, fin: string): string {
  if (aMin(inicio) < aMin(fin)) return fin;
  return deMin(Math.min(aMin(inicio) + 60, 23 * 60 + 59));
}
