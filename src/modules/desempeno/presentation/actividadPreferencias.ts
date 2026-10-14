import {
  FORMAS_COBRO,
  ORDENES_ACTIVIDAD,
  TIPOS_ACTIVIDAD,
  type FiltrosActividad,
} from "../domain/entities";
import { esUno } from "../domain/values/esUno";

export const CLAVES_COLUMNA = [
  "tipo",
  "hora",
  "cliente",
  "venta",
  "monto",
  "forma",
  "registro",
  "llegada",
  "fotos",
  "gps",
] as const;
export type ClaveColumna = (typeof CLAVES_COLUMNA)[number];

// Las del mock: forma de cobro y llegada al servidor arrancan ocultas.
export const COLUMNAS_POR_DEFECTO: ClaveColumna[] = [
  "tipo",
  "hora",
  "cliente",
  "venta",
  "monto",
  "registro",
  "fotos",
  "gps",
];
export const CLAVE_COLUMNAS = "desempeno.actividad.columnas.v1";
export const CLAVE_VISTAS = "desempeno.actividad.vistas.v1";

export type VistaGuardada = {
  id: string;
  nombre: string;
  filtros: FiltrosActividad;
  columnas: ClaveColumna[];
};

export function esListaDeColumnas(v: unknown): v is ClaveColumna[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((c) => typeof c === "string" && (CLAVES_COLUMNA as readonly string[]).includes(c))
  );
}

const esTextoONulo = (v: unknown): boolean => v === null || typeof v === "string";
const esBooleanoONulo = (v: unknown): boolean => v === null || typeof v === "boolean";
const esListaDe = (v: unknown, valido: (x: unknown) => boolean): boolean =>
  Array.isArray(v) && v.every(valido);
const esTexto = (v: unknown): boolean => typeof v === "string";

// Valida el esquema COMPLETO de los filtros guardados: una vista de una versión
// vieja o editada a mano se descarta en vez de mandar al API valores que el
// contrato no conoce.
export function esFiltrosActividad(v: unknown): v is FiltrosActividad {
  if (typeof v !== "object" || v === null) return false;
  const f = v as Record<string, unknown>;
  return (
    esTextoONulo(f.desde) &&
    esTextoONulo(f.hasta) &&
    esListaDe(f.tipos, (x) => esUno(TIPOS_ACTIVIDAD, x)) &&
    esListaDe(f.formasCobro, (x) => esUno(FORMAS_COBRO, x)) &&
    esListaDe(f.tiposVisita, esTexto) &&
    esListaDe(f.registradoPor, esTexto) &&
    esTextoONulo(f.montoMin) &&
    esTextoONulo(f.montoMax) &&
    esBooleanoONulo(f.conFotos) &&
    esBooleanoONulo(f.conGps) &&
    typeof f.q === "string" &&
    esUno(ORDENES_ACTIVIDAD, f.orden) &&
    (f.dir === "asc" || f.dir === "desc")
  );
}

function esVistaGuardada(x: unknown): x is VistaGuardada {
  if (typeof x !== "object" || x === null) return false;
  const v = x as Partial<VistaGuardada>;
  return (
    typeof v.id === "string" &&
    typeof v.nombre === "string" &&
    esFiltrosActividad(v.filtros) &&
    esListaDeColumnas(v.columnas)
  );
}

export function esListaDeVistas(v: unknown): v is VistaGuardada[] {
  return Array.isArray(v) && v.every(esVistaGuardada);
}
