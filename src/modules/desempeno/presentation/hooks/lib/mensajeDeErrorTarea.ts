import { esErrorDePermiso } from "@/lib/errorDePermiso";
import type { DomainError } from "../../../domain/errors";

// Textos cortos para los errores de tareas (spec §6.2). Lo que no está aquí
// usa el `detail` en español que manda msp-api (en minúsculas), con mayúscula
// inicial como el resto de la pantalla (dueño, 2026-10-20).
const MENSAJES: Record<string, string> = {
  tarea_fecha_pasada: "La fecha ya pasó",
};

function conMayuscula(s: string): string {
  return s.charAt(0).toLocaleUpperCase("es-MX") + s.slice(1);
}

export const MENSAJE_TAREAS_SIN_PERMISO = "No tienes permiso para asignar visitas";

export function mensajeDeErrorTarea(e: DomainError): string {
  if (esErrorDePermiso(e)) return MENSAJE_TAREAS_SIN_PERMISO;
  return MENSAJES[e.code] ?? conMayuscula(e.message);
}
