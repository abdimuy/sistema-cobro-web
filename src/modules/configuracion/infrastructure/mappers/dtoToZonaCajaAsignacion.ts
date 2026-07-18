import type { CatalogoRef, ZonaCajaAsignacion } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { CatalogoRefDTO, ZonaCajaAsignacionDTO } from "../http/dtos";

function refFromDto(ref: CatalogoRefDTO | null): CatalogoRef | null {
  if (ref === null) return null;
  if (typeof ref.id !== "number" || !Number.isFinite(ref.id)) {
    throw new DomainError(
      "zona_caja_ref_id_invalido",
      "el id del catálogo debe ser un número válido",
    );
  }
  return { id: ref.id, nombre: ref.nombre ?? "" };
}

export function dtoToZonaCajaAsignacion(dto: ZonaCajaAsignacionDTO): ZonaCajaAsignacion {
  if (typeof dto.zona_cliente_id !== "number" || !Number.isFinite(dto.zona_cliente_id)) {
    throw new DomainError(
      "zona_cliente_id_invalido",
      "zona_cliente_id debe ser un número válido",
    );
  }

  return {
    zonaClienteId: dto.zona_cliente_id,
    zonaNombre: dto.zona_nombre ?? "",
    caja: refFromDto(dto.caja),
    cajero: refFromDto(dto.cajero),
    vendedor: refFromDto(dto.vendedor),
    cobrador: refFromDto(dto.cobrador),
  };
}
