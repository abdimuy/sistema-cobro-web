import type { IdentidadMicrosip } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { IdentidadMicrosipDTO } from "../http/dtos";

export function dtoToIdentidadMicrosip(dto: IdentidadMicrosipDTO): IdentidadMicrosip {
  if (typeof dto.nombre !== "string" || dto.nombre.trim() === "") {
    throw new DomainError("identidad_nombre_requerido", "nombre es obligatorio");
  }

  if (typeof dto.match_count !== "number" || !Number.isFinite(dto.match_count)) {
    throw new DomainError(
      "identidad_match_count_invalido",
      "match_count debe ser un número válido",
    );
  }

  return {
    nombre: dto.nombre,
    v1ListaId: dto.v1_lista_id ?? null,
    v2ListaId: dto.v2_lista_id ?? null,
    v3ListaId: dto.v3_lista_id ?? null,
    matchCount: dto.match_count,
  };
}
