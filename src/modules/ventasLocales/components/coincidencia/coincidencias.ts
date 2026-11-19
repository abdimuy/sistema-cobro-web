import type { VentaLocal } from "@/services/api/getVentasLocales";
import type {
  CampoCoincidencia,
  Coincidencia,
  Segmento,
} from "../../domain/values/Coincidencia";
import type { ColumnId } from "../columns";

export const COLUMNA_DE_CAMPO: Record<CampoCoincidencia, ColumnId | null> = {
  cliente: "cliente",
  telefono: "telefono",
  folio: "microsipFolio",
  direccion: "direccion",
  articulos: null,
};

export const ETIQUETA_MOTIVO: Record<
  Exclude<CampoCoincidencia, "cliente">,
  string
> = {
  telefono: "teléfono",
  folio: "folio",
  direccion: "dirección",
  articulos: "artículos",
};

const ORDEN: CampoCoincidencia[] = [
  "cliente",
  "telefono",
  "folio",
  "direccion",
  "articulos",
];

function conocidas(venta: VentaLocal): Coincidencia[] {
  return (venta.COINCIDENCIAS ?? []).filter((c) => ORDEN.includes(c.campo));
}

export function coincidenciaDe(
  venta: VentaLocal,
  campo: CampoCoincidencia,
): Coincidencia | undefined {
  return conocidas(venta).find((c) => c.campo === campo);
}

export function motivosDe(
  venta: VentaLocal,
): Array<Exclude<CampoCoincidencia, "cliente">> {
  const presentes = new Set(conocidas(venta).map((c) => c.campo));
  return ORDEN.filter(
    (c): c is Exclude<CampoCoincidencia, "cliente"> =>
      c !== "cliente" && presentes.has(c),
  );
}

export function coincidenciasOcultas(
  venta: VentaLocal,
  visibles: ColumnId[],
): Coincidencia[] {
  const vistos = new Set<CampoCoincidencia>();
  return conocidas(venta).filter((c) => {
    if (vistos.has(c.campo)) return false;
    vistos.add(c.campo);
    const col = COLUMNA_DE_CAMPO[c.campo];
    return col === null || !visibles.includes(col);
  });
}

export function columnaDelBloque(visibles: ColumnId[]): ColumnId | undefined {
  return visibles.includes("cliente") ? "cliente" : visibles[0];
}

/**
 * Proyecta los segmentos del API (sobre los dígitos crudos) sobre el texto ya
 * formateado, p. ej. "3312345678" -> "(331) 234-5678". Un separador queda
 * resaltado solo si los dígitos a ambos lados coinciden. Si la cantidad de
 * dígitos no cuadra, devuelve los segmentos tal cual.
 */
export function segmentosSobreFormato(
  segmentos: Segmento[],
  formateado: string,
): Segmento[] {
  const banderas: boolean[] = [];
  for (const s of segmentos) {
    for (const ch of s.texto) if (/\d/.test(ch)) banderas.push(s.coincide);
  }
  const digitos = [...formateado].filter((c) => /\d/.test(c)).length;
  if (digitos !== banderas.length) return segmentos;

  const chars = [...formateado];
  const flags: boolean[] = [];
  let d = 0;
  chars.forEach((ch, i) => {
    if (/\d/.test(ch)) {
      flags.push(banderas[d++]);
      return;
    }
    const prev = d > 0 ? banderas[d - 1] : false;
    const next = d < banderas.length ? banderas[d] : false;
    flags[i] = prev && next;
  });
  const out: Segmento[] = [];
  chars.forEach((ch, i) => {
    const last = out[out.length - 1];
    if (last && last.coincide === flags[i]) last.texto += ch;
    else out.push({ texto: ch, coincide: flags[i] });
  });
  return out;
}
