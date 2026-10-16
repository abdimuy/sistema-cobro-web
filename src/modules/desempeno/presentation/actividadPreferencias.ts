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
  "nota",
  "forma",
  "registro",
  "llegada",
  "fotos",
  "gps",
] as const;
export type ClaveColumna = (typeof CLAVES_COLUMNA)[number];

// Las del mock: forma de cobro y llegada al servidor arrancan ocultas. La nota
// de la visita arranca visible; quien ya guardó sus columnas la activa en el
// menú de columnas.
export const COLUMNAS_POR_DEFECTO: ClaveColumna[] = [
  "tipo",
  "hora",
  "cliente",
  "venta",
  "monto",
  "nota",
  "registro",
  "fotos",
  "gps",
];
export const CLAVE_COLUMNAS = "desempeno.actividad.columnas.v2";
const CLAVE_COLUMNAS_V1 = "desempeno.actividad.columnas.v1";
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

function leerLista(almacen: Storage, clave: string): ClaveColumna[] | null {
  try {
    const crudo = almacen.getItem(clave);
    if (crudo === null) return null;
    const valor: unknown = JSON.parse(crudo);
    return esListaDeColumnas(valor) ? valor : null;
  } catch {
    return null;
  }
}

// D28: v2 manda. Si sólo hay v1 (guardada cuando "nota" no existía), gana
// "nota" una única vez y se guarda en v2; si luego la oculta, v2 se respeta.
// v1 no se borra. Una lista ilegible se ignora (null = por defecto).
export function leerColumnasGuardadas(almacen: Storage): ClaveColumna[] | null {
  const v2 = leerLista(almacen, CLAVE_COLUMNAS);
  if (v2 !== null) return v2;
  const v1 = leerLista(almacen, CLAVE_COLUMNAS_V1);
  if (v1 === null) return null;
  const migrada = v1.includes("nota") ? v1 : [...v1, "nota" as const];
  try {
    almacen.setItem(CLAVE_COLUMNAS, JSON.stringify(migrada));
  } catch {
    // Sin almacenamiento: la migración vive sólo esta sesión.
  }
  return migrada;
}
