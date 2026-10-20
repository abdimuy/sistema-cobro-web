import type { EstadoTarea, TareaConEstado } from "../../domain/entities";
import { horaCorta } from "./format";

// Texto del estado tal como lo deriva el servidor (spec §6.3). El nombre de
// quién atendió también viene del servidor (`atendida_por.cobrador_nombre`).
// Textos aprobados por el dueño (2026-10-20): mayúscula inicial, sin punto.
const ETIQUETA_ESTADO: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  atendida: "Atendida",
  no_atendida: "No atendida",
  cancelada: "Cancelada",
};

export function textoEstadoTarea(t: TareaConEstado): string {
  if (t.estado === "atendida" && t.atendidaPor) {
    const { cobradorNombre, instante } = t.atendidaPor;
    const hora = horaCorta(instante);
    return cobradorNombre ? `Atendida por ${cobradorNombre} a las ${hora}` : `Atendida a las ${hora}`;
  }
  return ETIQUETA_ESTADO[t.estado];
}
