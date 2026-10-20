import type { TareaConEstado } from "../../domain/entities";
import { horaCorta } from "./format";

// Texto del estado tal como lo deriva el servidor (spec §6.3). El nombre de
// quién atendió también viene del servidor (`atendida_por.cobrador_nombre`).
export function textoEstadoTarea(t: TareaConEstado): string {
  if (t.estado === "atendida" && t.atendidaPor) {
    const { cobradorNombre, instante } = t.atendidaPor;
    const hora = horaCorta(instante);
    return cobradorNombre ? `atendida por ${cobradorNombre} a las ${hora}` : `atendida a las ${hora}`;
  }
  return t.estado === "no_atendida" ? "no atendida" : t.estado;
}
