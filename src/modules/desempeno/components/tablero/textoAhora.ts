import type { Periodo, UsuarioTablero } from "../../domain/entities";
import { horaCorta } from "../lib/format";

// "No ha empezado" es un estado de hoy: en Semana se rotula "Hoy sin actividad"
// (mismo texto que la ficha).
export function textoAhora(u: UsuarioTablero, periodo: Periodo): string {
  if (u.estadoAhora === "activo") return "Activo";
  if (u.estadoAhora === "sin_actividad") return `Desde ${u.estadoDesde ? horaCorta(u.estadoDesde) : "—"}`;
  return periodo === "semana" ? "Hoy sin actividad" : "No ha empezado";
}
