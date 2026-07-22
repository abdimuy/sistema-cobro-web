import type {
  Conversacion,
  ConversacionDetalle,
  Decision,
  Turno,
} from "../../domain/entities";
import type {
  ConversacionDTO,
  ConversacionDetalleResponseDTO,
  DecisionDTO,
  TurnoDTO,
} from "../http/dtos";

function dtoToConversacion(dto: ConversacionDTO): Conversacion {
  return {
    clienteId: dto.cliente_id,
    nombre: dto.nombre ?? "",
    segmento: dto.segmento ?? "",
    telefono: dto.telefono ?? "",
    estado: dto.estado ?? "",
    asignadoA: dto.asignado_a ?? "",
    contextoNota: dto.contexto_nota ?? "",
    banderas: dto.banderas ?? [],
    resumenMemoria: dto.resumen_memoria ?? "",
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function dtoToTurno(dto: TurnoDTO): Turno {
  return {
    direccion: dto.direccion as Turno["direccion"],
    autor: dto.autor as Turno["autor"],
    cuerpo: dto.cuerpo ?? "",
    mensajeRef: dto.mensaje_ref ?? "",
    createdAt: dto.created_at,
  };
}

function dtoToDecision(dto: DecisionDTO): Decision {
  return {
    intencion: dto.intencion ?? "",
    confianza: dto.confianza ?? 0,
    senales: dto.senales ?? [],
    accion: dto.accion ?? "",
    borrador: dto.borrador ?? "",
    evidencia: dto.evidencia ?? [],
    razonEscalamiento: dto.razon_escalamiento ?? "",
    resultado: dto.resultado ?? "",
    createdAt: dto.created_at,
  };
}

export function dtoToConversacionDetalle(
  dto: ConversacionDetalleResponseDTO,
): ConversacionDetalle {
  return {
    conversacion: dtoToConversacion(dto.conversacion),
    turnos: (dto.turnos ?? []).map(dtoToTurno),
    decisiones: (dto.decisiones ?? []).map(dtoToDecision),
  };
}
