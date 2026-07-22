import type { DecisionResult } from "../../domain/entities";
import type { DecisionResultDTO } from "../http/dtos";

export function dtoToDecisionResult(dto: DecisionResultDTO): DecisionResult {
  return {
    intencion: dto.intencion ?? "",
    confianza: dto.confianza ?? 0,
    senales: dto.senales ?? [],
    accion: dto.accion ?? "",
    borrador: dto.borrador ?? "",
    evidencia: dto.evidencia ?? [],
    razonEscalamiento: dto.razon_escalamiento ?? "",
    resultado: dto.resultado ?? "",
    escalada: dto.escalada ?? false,
  };
}
