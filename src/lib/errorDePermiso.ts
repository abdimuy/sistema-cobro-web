// Códigos con los que llega un 403 a los mappers de error de cada módulo:
// - `http_403`: el servidor no mandó código legible (p. ej. el 403 de Huma de
//   desempeno:ver, que no trae "code=...").
// - `permiso_denegado`: writePlainError de cobranza/visitas/ventas en msp-api.
// - `permission_denied`: el authz de msp-api (apperror.NewForbidden).
// - `forbidden`: forma Problem Details con `code` plano.
const CODIGOS_SIN_PERMISO = new Set(["http_403", "permiso_denegado", "permission_denied", "forbidden"]);

export function esErrorDePermiso(error: { readonly code: string } | null | undefined): boolean {
  return error != null && CODIGOS_SIN_PERMISO.has(error.code);
}

export const MENSAJE_FOTOS_SIN_PERMISO = "No tienes permiso para ver las fotos";
export const MENSAJE_FOTOS_ERROR = "No se pudieron cargar las fotos";

export function mensajeErrorFotos(error: { readonly code: string }): string {
  return esErrorDePermiso(error) ? MENSAJE_FOTOS_SIN_PERMISO : MENSAJE_FOTOS_ERROR;
}
