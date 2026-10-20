import { esErrorDePermiso } from "@/lib/errorDePermiso";
import type { DomainError } from "../../../domain/errors";

// Textos cortos para los errores de tareas (spec §6.2). Lo que no está aquí
// usa el `detail` en español que manda msp-api.
const MENSAJES: Record<string, string> = {
  tarea_fecha_pasada: "la fecha ya pasó",
};

export const MENSAJE_TAREAS_SIN_PERMISO = "no tienes permiso para asignar visitas";

export function mensajeDeErrorTarea(e: DomainError): string {
  if (esErrorDePermiso(e)) return MENSAJE_TAREAS_SIN_PERMISO;
  return MENSAJES[e.code] ?? e.message;
}
