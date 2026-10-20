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
    // Sin hora (pago sin hora) o sin nombre: se dice solo lo que el servidor sabe.
    const por = cobradorNombre ? ` por ${cobradorNombre}` : "";
    const a = instante ? ` a las ${horaCorta(instante)}` : "";
    return `Atendida${por}${a}`;
  }
  return ETIQUETA_ESTADO[t.estado];
}
