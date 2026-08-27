import type { Usuario } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { UsuarioResponseDTO } from "../http/dtos";

function malformed(): DomainError {
  return new DomainError(
    "malformed_response",
    "respuesta del servidor con formato inválido",
  );
}

// dtoToUsuario validates the required fields and maps the wire shape to the
// domain entity. Throws DomainError("malformed_response", ...) when the
// backend response is missing or mistypes a required field.
export function dtoToUsuario(dto: UsuarioResponseDTO): Usuario {
  if (typeof dto?.id !== "string" || dto.id.trim() === "") {
    throw malformed();
  }
  // El alta SIEMPRE manda firebase_uid, así que aquí sí es obligatorio (a
  // diferencia del listado de usuariosRoles, donde "" es un estado válido para
  // filas dadas de alta por SQL).
  if (typeof dto.firebase_uid !== "string" || dto.firebase_uid.trim() === "") {
    throw malformed();
  }
  if (typeof dto.email !== "string" || dto.email.trim() === "") {
    throw malformed();
  }
  if (typeof dto.nombre !== "string" || dto.nombre.trim() === "") {
    throw malformed();
  }
  if (dto.telefono != null && typeof dto.telefono !== "string") {
    throw malformed();
  }
  if (dto.almacen_id != null && typeof dto.almacen_id !== "number") {
    throw malformed();
  }
  if (typeof dto.activo !== "boolean") {
    throw malformed();
  }

  return {
    id: dto.id,
    firebaseUid: dto.firebase_uid,
    email: dto.email,
    nombre: dto.nombre,
    telefono: typeof dto.telefono === "string" ? dto.telefono : null,
    almacenId: typeof dto.almacen_id === "number" ? dto.almacen_id : null,
    activo: dto.activo,
  };
}
