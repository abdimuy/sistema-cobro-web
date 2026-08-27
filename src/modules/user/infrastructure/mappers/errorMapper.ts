import axios from "axios";
import { DomainError } from "../../domain/errors";

const SESION_EXPIRADA = "sesión expirada; vuelve a entrar";
const SIN_PERMISO = "no tienes permisos para registrar usuarios";
const CUENTA_INACTIVA = "tu cuenta está desactivada";

// Mapa de códigos de apperror → copia en español para la operadora. Los
// códigos son estables y VERIFICADOS uno por uno contra msp-api; los mensajes
// son copia de presentación.
//
// Sólo se listan códigos que POST /v2/usuarios puede emitir de verdad. Un
// código inventado no falla ruidosamente: cae al `detail` del backend, que a
// veces sirve y a veces no ("uno o más campos no son válidos"), así que la
// única forma de saber que el mapa funciona es haberlo cotejado con el Go.
const FRIENDLY_MESSAGES: Record<string, string> = {
  // 409 — internal/auth/domain/errors.go:23 (ErrUsuarioYaExiste). Lo levanta
  // el repositorio al chocar contra los UNIQUE de EMAIL/FIREBASE_UID
  // (internal/auth/infra/firebird/usuario_repo.go:68).
  usuario_ya_existe: "ya existe un usuario con ese correo",

  // 403 — internal/auth/infra/authhttp/authz.go:32 (RequirePermission con
  // domain.PermUsuariosCrear; routes.go:58).
  permission_denied: SIN_PERMISO,
  // 403 — internal/auth/infra/authhttp/authn.go:89.
  user_inactive: CUENTA_INACTIVA,
  // 403 — internal/auth/domain/errors.go:29 (ErrUsuarioInactivo).
  usuario_inactivo: CUENTA_INACTIVA,

  // 401 — authn.go:114 y :121 (missing_authorization), :117
  // (invalid_authorization), :82 (user_not_found), y handlers_usuarios.go:69
  // (unauthenticated). Los cuatro significan lo mismo para quien opera la
  // pantalla: la sesión del admin ya no sirve.
  missing_authorization: SESION_EXPIRADA,
  invalid_authorization: SESION_EXPIRADA,
  unauthenticated: SESION_EXPIRADA,
  user_not_found: SESION_EXPIRADA,

  // 422 del dominio — internal/auth/app/usuarios.go:64-79 vía los
  // constructores de VO. Se reescriben sólo los que filtran jerga interna;
  // el resto cae al `detail`, que ya viene en español correcto.
  firebase_uid_invalid: "el identificador de Firebase no es válido",
  firebase_uid_required: "falta el identificador de Firebase",
  firebase_uid_too_long: "el identificador de Firebase es demasiado largo",
  telefono_invalid: "el teléfono no es válido",

  // Sintéticos del adaptador: NO vienen del API, los arma este mapper cuando
  // no hubo respuesta HTTP.
  network_error: "sin conexión con el servidor",
  timeout: "el servidor no respondió a tiempo",
};

// Nombres de campo del wire → cómo se llaman en la pantalla.
const CAMPOS: Record<string, string> = {
  telefono: "el teléfono",
  email: "el correo",
  nombre: "el nombre",
  firebase_uid: "el identificador de Firebase",
};

type FieldError = { field?: unknown; code?: unknown };

// mensajeDeCampos arma la copia del 422 de validación de struct, el ÚNICO
// caso en que el `detail` del backend no dice nada útil: response.go:121 lo
// fija en "uno o más campos no son válidos" y el motivo real vive en
// `errors[]` (response.go:52-61, internal/platform/validator/validator.go:66).
//
// Sin esto, un teléfono de más de 30 caracteres (el ancho de TELEFONO
// VARCHAR(30), validado con `max=30` en authhttp/dto.go:25) sale como un error
// genérico y la oficina no tiene forma de saber qué corregir.
function mensajeDeCampos(data: Record<string, unknown>): string | null {
  if (!Array.isArray(data.errors)) return null;

  const partes: string[] = [];
  for (const raw of data.errors) {
    if (!raw || typeof raw !== "object") continue;
    const { field, code } = raw as FieldError;
    if (typeof field !== "string" || field === "") continue;

    const campo = CAMPOS[field] ?? `el campo ${field}`;
    // `code` es el tag del validador (validator.go:76 → fe.Tag()).
    if (code === "max") partes.push(`${campo} es demasiado largo`);
    else if (code === "required") partes.push(`falta ${campo}`);
    else partes.push(`${campo} no es válido`);
  }

  return partes.length > 0 ? partes.join("; ") : null;
}

// apperrorToDomainError traduce lo que sea que lanzó axios a un DomainError.
//
// FORMA DEL CUERPO — una sola, no dos. POST /v2/usuarios se monta en **chi**
// (internal/auth/infra/authhttp/routes.go:58) y responde por
// internal/platform/response, que emite un Problem Details de RFC 9457 PLANO:
//
//   { type, title, status, detail?, instance?, code?, request_id?,
//     errors?: [{ field, code, message }], fields? }
//
// No hay sobre de Huma aquí: no existe `message` de primer nivel ni
// `errors[].message = "code=<x>"`. El módulo hermano usuariosRoles, que pega
// contra ESTE MISMO router, ya lo documenta igual
// (usuariosRoles/infrastructure/mappers/errorMapper.ts:24-32). Este mapper
// llegó a traer además la tolerancia al sobre de Huma "por si acaso"; se quitó
// al confirmar el router, porque `response.Error` (response.go:96-105) SIEMPRE
// escribe un `code` de primer nivel y la rama de Huma no podía ejecutarse
// nunca.
//
// `errors[]` aquí NO lleva códigos de apperror: es el detalle por campo del
// 422 de validación, y no tiene relación con el `code` de primer nivel.
export function apperrorToDomainError(err: unknown): DomainError {
  if (err instanceof DomainError) return err;

  if (axios.isAxiosError(err)) {
    const data = (err.response?.data ?? {}) as Record<string, unknown>;

    // `http_<status>` es el último recurso y sólo alcanza a respuestas que NO
    // salieron de `response.Error` — un proxy inverso, el túnel, o el 404/405
    // en texto plano de chi. Cualquier error del API trae `code`.
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

    // response.go:123 fija el código del 422 de struct en "validation_failed";
    // el motivo por campo está en `errors[]`.
    const friendly =
      code === "validation_failed"
        ? (mensajeDeCampos(data) ?? FRIENDLY_MESSAGES[code])
        : FRIENDLY_MESSAGES[code];

    return new DomainError(code, friendly ?? backendMessage);
  }

  if (err instanceof Error) {
    return new DomainError("error_inesperado", err.message);
  }
  return new DomainError("error_inesperado", String(err));
}
