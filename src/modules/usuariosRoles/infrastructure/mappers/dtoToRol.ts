import type { Rol } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { RolResponseDTO } from "../http/dtos";

// dtoToRol validates the required fields and maps the wire shape to the
// domain entity. `description` absent/undefined maps to `null` — the
// domain models "no description" as null, never undefined. Throws
// DomainError("malformed_response", ...) when the backend response is
// missing or mistypes a required field.
export function dtoToRol(dto: RolResponseDTO): Rol {
  if (typeof dto.id !== "string" || dto.id.trim() === "") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }
  if (typeof dto.nombre !== "string" || dto.nombre.trim() === "") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }
  if (typeof dto.inmutable !== "boolean") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }
  if (typeof dto.activo !== "boolean") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }

  return {
    id: dto.id,
    nombre: dto.nombre,
    description: dto.description ?? null,
    inmutable: dto.inmutable,
    activo: dto.activo,
  };
}
