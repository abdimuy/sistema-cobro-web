import type { Usuario } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { UsuarioResponseDTO } from "../http/dtos";

// dtoToUsuario validates the required fields and maps the wire shape to the
// domain entity. Throws DomainError("malformed_response", ...) when the
// backend response is missing or mistypes a required field.
export function dtoToUsuario(dto: UsuarioResponseDTO): Usuario {
  if (typeof dto.id !== "string" || dto.id.trim() === "") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }
  if (typeof dto.firebase_uid !== "string" || dto.firebase_uid.trim() === "") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }
  if (typeof dto.email !== "string" || dto.email.trim() === "") {
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
  if (typeof dto.activo !== "boolean") {
    throw new DomainError(
      "malformed_response",
      "respuesta del servidor con formato inválido",
    );
  }

  return {
    id: dto.id,
    firebaseUid: dto.firebase_uid,
    email: dto.email,
    nombre: dto.nombre,
    activo: dto.activo,
  };
}
