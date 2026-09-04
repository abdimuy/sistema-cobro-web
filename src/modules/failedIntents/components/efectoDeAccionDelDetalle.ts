import type { AccionMutante } from "./accionesCopy";

/** Las acciones que ofrece el panel de detalle de un intento. */
export type AccionDelDetalle = "replay" | "resolve" | "replay-with";

/**
 * Qué debe pasar al pulsar una acción del panel de detalle.
 *
 *  - `confirmar` → abre el diálogo de confirmación con esa acción.
 *  - `abrir_editor` → abre el panel de edición, sin diálogo.
 */
export type EfectoDeAccion =
  | { tipo: "confirmar"; accion: AccionMutante }
  | { tipo: "abrir_editor" };

/**
 * ABRIR EL EDITOR NO PIDE CONFIRMACIÓN. La confirmación va al guardar.
 *
 * Antes iba al revés y el resultado era que **el editor no se abría nunca**.
 * El diálogo de `reenviar_editado` dice «se enviará la venta con los datos que
 * acabas de editar, no con los que capturó el vendedor» — un texto correcto
 * DESPUÉS de editar y falso antes, porque en ese momento no hay ningún dato
 * editado. Prometía un envío inmediato de algo que no existía, así que lo
 * sensato era cancelarlo; y cancelarlo era justamente lo que impedía llegar al
 * editor. Encima llevaba doble confirmación, así que había que insistir dos
 * veces sobre un aviso que no correspondía.
 *
 * Moverla al guardado arregla las dos mitades a la vez: el editor se abre de
 * un clic, y el texto del diálogo pasa a ser cierto sin tocarle una palabra.
 *
 * Reportado en producción el 2026-09-04 sobre la venta de KAREN JANET RAMIREZ
 * CRUZ, que llevaba 8 intentos y no se podía corregir.
 */
export function efectoDeAccionDelDetalle(accion: AccionDelDetalle): EfectoDeAccion {
  switch (accion) {
    case "replay":
      return { tipo: "confirmar", accion: "reenviar" };
    case "resolve":
      return { tipo: "confirmar", accion: "atender" };
    case "replay-with":
      return { tipo: "abrir_editor" };
  }
}
