import type { TareaConEstado } from "../../domain/entities";
import { horaCorta } from "./format";

// Texto del estado tal como lo deriva el servidor (spec §6.3). Quién atendió
// solo se nombra si el llamador sabe el nombre del cobrador: el contrato trae
// el id, no el nombre.
export function textoEstadoTarea(
  t: TareaConEstado,
  nombreDeCobrador?: (cobradorId: number) => string | null,
): string {
  if (t.estado === "atendida" && t.atendidaPor) {
    const a = t.atendidaPor;
    const nombre = a.cobradorId !== null ? (nombreDeCobrador?.(a.cobradorId) ?? null) : null;
    const hora = horaCorta(a.instante);
    return nombre ? `atendida por ${nombre} a las ${hora}` : `atendida a las ${hora}`;
  }
  return t.estado === "no_atendida" ? "no atendida" : t.estado;
}
