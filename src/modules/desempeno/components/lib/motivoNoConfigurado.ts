import type { MotivoNoConfigurado } from "../../domain/entities";

// Por qué un usuario no tiene tablero ni ficha (contrato v2.1 §2). Lo usan la
// fila del tablero y la ficha abierta por URL, para que digan lo mismo.
export const MENSAJE_SIN_CONFIGURAR: Record<MotivoNoConfigurado, string> = {
  sin_zona: "No tiene zona asignada. Sin zona no se puede medir su jornada ni sus cuentas.",
  sin_inicio_semana: "No tiene inicio de semana. Sin él no se puede medir su jornada ni sus cuentas.",
  inicio_semana_futuro: "Su inicio de semana todavía no llega. Revisa la fecha en Usuarios.",
};

// Respaldo si el API no dice el motivo (o manda uno que este escritorio no conoce).
export const MENSAJE_SIN_CONFIGURAR_GENERICO =
  "Falta configurarlo. Sin zona e inicio de semana no se puede medir su jornada ni sus cuentas.";

export function mensajeSinConfigurar(motivo: MotivoNoConfigurado | null): string {
  return (motivo && MENSAJE_SIN_CONFIGURAR[motivo]) || MENSAJE_SIN_CONFIGURAR_GENERICO;
}
