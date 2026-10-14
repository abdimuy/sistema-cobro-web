import type { Actividad, OrdenActividad } from "../../domain/entities";
import { diaDeNegocioDe, fechaLarga } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";

export type Agrupacion = "" | "dia" | "cliente" | "venta" | "tipo";
type Criterio = Exclude<Agrupacion, "">;

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
export const ORDEN_PARA_AGRUPAR: Record<Criterio, OrdenActividad> = {
  dia: "hora",
  cliente: "cliente",
  venta: "cliente",
  tipo: "tipo",
};

// Grupo: `clave` identifica (ids del API, nunca nombres ni folios, que se
// repiten); `etiqueta` es solo lo que se lee.
export type Grupo = { clave: string; etiqueta: string; items: Actividad[] };

function claveYEtiqueta(a: Actividad, g: Criterio): { clave: string; etiqueta: string } {
  switch (g) {
    case "dia": {
      const dia = diaDeNegocioDe(a.hora);
      return { clave: dia, etiqueta: fechaLarga(dia) };
    }
    case "cliente":
      return { clave: `cliente:${a.clienteId}`, etiqueta: a.clienteNombre };
    case "venta":
      return {
        clave: a.ventaId === null ? `sin-venta:${a.clienteId}` : `venta:${a.ventaId}`,
        etiqueta: `${a.folio ?? "Sin venta"} · ${a.clienteNombre}`,
      };
    case "tipo":
      return { clave: a.tipo, etiqueta: TIPO_ACTIVIDAD_META[a.tipo].etiqueta };
  }
}

function consecutivos(items: readonly Actividad[], g: Criterio): Grupo[] {
  const grupos: Grupo[] = [];
  for (const a of items) {
    const { clave, etiqueta } = claveYEtiqueta(a, g);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.clave === clave) ultimo.items.push(a);
    else grupos.push({ clave, etiqueta, items: [a] });
  }
  return grupos;
}

// Agrupa renglones CONSECUTIVOS en el orden que mandó el servidor. Solo
// etiqueta; no suma importes ni cuenta (D10).
//
// "Por venta": el servidor ordena por cliente, pero dentro de un cliente las
// ventas pueden venir intercaladas; dentro del bloque de cada cliente se juntan
// por venta_id en el orden en que aparece cada venta.
export function agruparConsecutivos(items: readonly Actividad[], g: Criterio): Grupo[] {
  if (g !== "venta") return consecutivos(items, g);
  return consecutivos(items, "cliente").flatMap((bloque) => {
    const porVenta = new Map<string, Grupo>();
    for (const a of bloque.items) {
      const { clave, etiqueta } = claveYEtiqueta(a, "venta");
      const grupo = porVenta.get(clave);
      if (grupo) grupo.items.push(a);
      else porVenta.set(clave, { clave, etiqueta, items: [a] });
    }
    return [...porVenta.values()];
  });
}
