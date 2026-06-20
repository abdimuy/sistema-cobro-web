import type { PuntoCompradoAbonado } from "../../../domain/entities/FichaCliente";

const MONTH_NAMES = [
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

export function monthLabel(anio: number, mes: number): string {
  const name = MONTH_NAMES[(mes - 1) % 12] ?? String(mes);
  return `${name} ${String(anio).slice(-2)}`;
}

// SpinePoint is a single month of the chart, numeric and ready to plot.
export type SpinePoint = {
  label: string;
  anio: number;
  mes: number;
  comprado: number;
  cobranza: number;
  enganche: number;
  condonacion: number;
  perdida: number;
  otro: number;
  abonadoTotal: number;
};

export const SPINE_MONTHS = 24;

// buildCompradoAbonadoSpine returns exactly SPINE_MONTHS points ending in the
// month of `today`, filling months without data with zeros. This resolves both
// "recent months without payments are missing" and the 24-month cap entirely in
// the presentation layer; the backend only sends months that have data.
export function buildCompradoAbonadoSpine(
  data: PuntoCompradoAbonado[],
  today: Date,
): SpinePoint[] {
  const byKey = new Map<string, PuntoCompradoAbonado>();
  for (const p of data) byKey.set(`${p.anio}-${p.mes}`, p);

  const points: SpinePoint[] = [];
  for (let i = SPINE_MONTHS - 1; i >= 0; i--) {
    // new Date(year, monthIndex - i, 1) handles year rollover correctly.
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const anio = d.getFullYear();
    const mes = d.getMonth() + 1;
    const src = byKey.get(`${anio}-${mes}`);
    const cobranza = Number(src?.cobranza ?? 0);
    const enganche = Number(src?.enganche ?? 0);
    const condonacion = Number(src?.condonacion ?? 0);
    const perdida = Number(src?.perdida ?? 0);
    const otro = Number(src?.otro ?? 0);
    points.push({
      label: monthLabel(anio, mes),
      anio,
      mes,
      comprado: Number(src?.comprado ?? 0),
      cobranza,
      enganche,
      condonacion,
      perdida,
      otro,
      abonadoTotal: cobranza + enganche + condonacion + perdida + otro,
    });
  }
  return points;
}
