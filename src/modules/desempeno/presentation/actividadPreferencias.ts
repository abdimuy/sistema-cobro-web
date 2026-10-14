import type { FiltrosActividad } from "../domain/entities";

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

function esVistaGuardada(x: unknown): x is VistaGuardada {
  if (typeof x !== "object" || x === null) return false;
  const v = x as Partial<VistaGuardada>;
  return (
    typeof v.id === "string" &&
    typeof v.nombre === "string" &&
    typeof v.filtros === "object" &&
    v.filtros !== null &&
    esListaDeColumnas(v.columnas)
  );
}

export function esListaDeVistas(v: unknown): v is VistaGuardada[] {
  return Array.isArray(v) && v.every(esVistaGuardada);
}
