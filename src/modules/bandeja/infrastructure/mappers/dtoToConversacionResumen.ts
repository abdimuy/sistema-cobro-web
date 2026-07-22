import type { ConversacionResumen, UltimaDecision } from "../../domain/entities";
import type { ConversacionResumenDTO, UltimaDecisionDTO } from "../http/dtos";

function dtoToUltimaDecision(dto: UltimaDecisionDTO): UltimaDecision {
  return {
    intencion: dto.intencion ?? "",
    confianza: dto.confianza ?? 0,
    accion: dto.accion ?? "",
    resultado: dto.resultado ?? "",
    razonEscalamiento: dto.razon_escalamiento ?? "",
  };
}

export function dtoToConversacionResumen(dto: ConversacionResumenDTO): ConversacionResumen {
  return {
    clienteId: dto.cliente_id,
    nombre: dto.nombre ?? "",
    segmento: dto.segmento ?? "",
    estado: dto.estado ?? "",
    asignadoA: dto.asignado_a ?? "",
    updatedAt: dto.updated_at,
    ultimoMensaje: dto.ultimo_mensaje ?? "",
    ultimaDecision: dto.ultima_decision ? dtoToUltimaDecision(dto.ultima_decision) : null,
  };
}
