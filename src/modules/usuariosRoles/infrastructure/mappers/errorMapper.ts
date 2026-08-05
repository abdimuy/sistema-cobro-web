import axios from "axios";
import { DomainError } from "../../domain/errors";

// Map of backend apperror codes → user-friendly Spanish messages. The codes
// come from internal/auth/domain/errors.go (and internal/auth/infra/
// authhttp/authz.go for the authorization guard) in msp-api. The codes are
// stable; the messages are presentation-layer copy. Anything not listed
// falls through to whatever message the backend returned (apperror always
// populates a Spanish `detail`).
const FRIENDLY_MESSAGES: Record<string, string> = {
  permission_denied: "no tienes permisos para administrar usuarios y roles",
  usuario_not_found: "el usuario ya no existe",
  usuario_ya_existe: "ya existe un usuario con esos datos",
  usuario_inactivo: "el usuario está inactivo",
  rol_not_found: "el rol ya no existe",
  rol_inmutable: "no se puede modificar un rol inmutable",
  rol_ya_existe: "ya existe un rol con ese nombre",
  rol_nombre_required: "el nombre del rol es obligatorio",
  rol_nombre_too_long: "el nombre del rol excede el máximo permitido",
  rol_description_too_long: "la descripción del rol excede el máximo permitido",
  permiso_not_found: "el permiso ya no existe",
};

// apperrorToDomainError maps whatever the axios client threw into a
// DomainError. This module talks to internal/auth/infra/authhttp, a plain
// chi + internal/platform/response backend — NOT Huma. Its error body is a
// flat RFC 9457 Problem Details document with top-level fields:
//   { type, title, status, detail?, instance?, code?, request_id?, errors?, fields? }
// (see internal/platform/response/response.go — `Problem`). There is no
// `message` field and no nested `errors[].message` "code=<x>" envelope;
// `errors` here is reserved for 422 field-validation details, unrelated to
// the top-level `code`.
export function apperrorToDomainError(err: unknown): DomainError {
  if (err instanceof DomainError) return err;

  if (axios.isAxiosError(err)) {
    const data = (err.response?.data ?? {}) as Record<string, unknown>;

    const code =
      (typeof data.code === "string" && data.code) ||
      (err.code === "ECONNABORTED" ? "timeout" : null) ||
      (err.message?.toLowerCase().includes("network") ? "network_error" : null) ||
      `http_${err.response?.status ?? "error"}`;

    const backendMessage =
      (typeof data.detail === "string" && data.detail) ||
      (typeof data.title === "string" && data.title) ||
      err.message ||
      "error de red";

    const friendly = FRIENDLY_MESSAGES[code];
    return new DomainError(code, friendly ?? backendMessage);
  }

  if (err instanceof Error) {
    return new DomainError("error_inesperado", err.message);
  }
  return new DomainError("error_inesperado", String(err));
}
