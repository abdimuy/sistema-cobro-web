import type { ZonaExcluidaDesempeno } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { ZonaExcluidaDesempenoDTO } from "../http/dtos";

export function dtoToZonaExcluidaDesempeno(dto: ZonaExcluidaDesempenoDTO): ZonaExcluidaDesempeno {
  if (typeof dto.zona_id !== "number" || !Number.isFinite(dto.zona_id)) {
    throw new DomainError("zona_id_invalido", "zona_id debe ser un número válido");
  }
  return {
    zonaId: dto.zona_id,
    zonaNombre: dto.zona_nombre ?? "",
    createdAt: dto.created_at ?? "",
  };
}
