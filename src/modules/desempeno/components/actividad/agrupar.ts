import type { Actividad, OrdenActividad } from "../../domain/entities";
import { diaDeNegocioDe, fechaLarga } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";

export type Agrupacion = "" | "dia" | "cliente" | "venta" | "tipo";

export const AGRUPACIONES: ReadonlyArray<readonly [Agrupacion, string]> = [
  ["", "Sin agrupar"],
  ["dia", "Por día"],
  ["cliente", "Por cliente"],
  ["venta", "Por venta"],
  ["tipo", "Por tipo"],
];

// Para agrupar se pide al servidor el orden que junta los renglones del mismo
// grupo. "venta" no tiene orden propio en el contrato: se pide por cliente
// (contrato §4: "Agrupar por venta = orden=cliente y agrupación en pantalla").
export const ORDEN_PARA_AGRUPAR: Record<Exclude<Agrupacion, "">, OrdenActividad> = {
  dia: "hora",
  cliente: "cliente",
  venta: "cliente",
  tipo: "tipo",
};

export function claveDeGrupo(a: Actividad, g: Exclude<Agrupacion, "">): string {
  switch (g) {
    case "dia":
      return fechaLarga(diaDeNegocioDe(a.hora));
    case "cliente":
      return a.clienteNombre;
    case "venta":
      return `${a.folio ?? "Sin venta"} · ${a.clienteNombre}`;
    case "tipo":
      return TIPO_ACTIVIDAD_META[a.tipo].etiqueta;
  }
}

// Agrupa renglones CONSECUTIVOS en el orden que mandó el servidor. Solo
// etiqueta; no suma importes ni cuenta (D10).
export function agruparConsecutivos(
  items: readonly Actividad[],
  g: Exclude<Agrupacion, "">,
): Array<{ clave: string; items: Actividad[] }> {
  const grupos: Array<{ clave: string; items: Actividad[] }> = [];
  for (const a of items) {
    const clave = claveDeGrupo(a, g);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.clave === clave) ultimo.items.push(a);
    else grupos.push({ clave, items: [a] });
  }
  return grupos;
}
