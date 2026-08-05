import type { Permiso } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { PermisoResponseDTO } from "../http/dtos";

// dtoToPermiso validates the required fields and maps the wire shape to the
// domain entity. Throws DomainError("malformed_response", ...) when the
// backend response is missing or mistypes a required field.
export function dtoToPermiso(dto: PermisoResponseDTO): Permiso {
  if (typeof dto.codigo !== "string" || dto.codigo.trim() === "") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }
  if (typeof dto.description !== "string") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }
  if (typeof dto.categoria !== "string" || dto.categoria.trim() === "") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }

  return {
    codigo: dto.codigo,
    description: dto.description,
    categoria: dto.categoria,
  };
}
