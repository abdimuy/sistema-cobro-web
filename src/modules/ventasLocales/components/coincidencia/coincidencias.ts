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

/**
 * Recorta el texto ANTES de la primera coincidencia a `antes` caracteres (con
 * "…"), para que en una línea de un renglón lo resaltado nunca quede cortado
 * por la elipsis del final. El final lo recorta el CSS (truncate).
 */
export function ventanaAlrededor(segmentos: Segmento[], antes = 16): Segmento[] {
  const i = segmentos.findIndex((s) => s.coincide);
  if (i <= 0) return segmentos;
  const previo = segmentos.slice(0, i).map((s) => s.texto).join("");
  if (previo.length <= antes) return segmentos;
  const corte = previo.slice(previo.length - antes);
  // Sin cortar a media palabra si hay un espacio cerca.
  const espacio = corte.indexOf(" ");
  const limpio = espacio >= 0 && espacio < 8 ? corte.slice(espacio + 1) : corte;
  return [{ texto: `…${limpio}`, coincide: false }, ...segmentos.slice(i)];
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
