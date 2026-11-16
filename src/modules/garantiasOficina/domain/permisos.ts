import type { TipoComandoArticulo } from "./comandos";

export type PermisoGarantia =
  | "garantias:leer"
  | "garantias:crear"
  | "garantias:actualizar"
  | "garantias:autorizar"
  | "garantias:cerrar";

const PERMISOS_COMANDO: Record<TipoComandoArticulo, PermisoGarantia> = {
  diagnostico: "garantias:actualizar",
  dictamen: "garantias:actualizar",
  "cambio-fisico": "garantias:autorizar",
  desenlace: "garantias:autorizar",
};

export function puedeEjecutarComando(
  permisos: readonly string[],
  comando: TipoComandoArticulo,
): boolean {
  return permisos.includes(PERMISOS_COMANDO[comando]);
}

export function puedeLeerGarantias(
  permisos: readonly string[],
): boolean {
  return permisos.includes("garantias:leer");
}

export function puedeListoEntrega(
  permisos: readonly string[],
): boolean {
  return permisos.includes("garantias:actualizar");
}

export function puedeCerrarGarantia(
  permisos: readonly string[],
): boolean {
  return permisos.includes("garantias:cerrar");
}
