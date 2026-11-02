import type { Jornada } from "../../domain/entities";
import { horaCorta } from "../lib/format";

/**
 * ¿La última actividad de la jornada es un "Fin del día"? Sólo con datos del
 * servidor: `fecha` y `hoy` (día de negocio), `generadoAt` (su "ahora") y el
 * horario configurado (`horario.hastaHora`, "HH:mm").
 * - fecha anterior a hoy            -> fin del día
 * - hoy y ya pasó el fin del horario -> fin del día
 * - hoy sin horario o antes del fin  -> sigue en curso ("Última actividad")
 */
export function finDelDiaTerminado(j: Pick<Jornada, "fecha" | "hoy" | "generadoAt" | "horario">): boolean {
  if (j.fecha < j.hoy) return true;
  if (j.fecha > j.hoy || !j.horario) return false;
  return horaCorta(j.generadoAt) > j.horario.hastaHora;
}
