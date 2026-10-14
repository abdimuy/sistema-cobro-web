import type { DomainError } from "../../domain/errors";

// Códigos 409 del contrato (§0) cuando el usuario no tiene zona o inicio de
// semana. No se arreglan reintentando: se configuran en Usuarios (/settings).
export const CODIGOS_SIN_CONFIGURAR = [
  "desempeno_usuario_sin_zona",
  "desempeno_usuario_sin_inicio_semana",
] as const;

export const RUTA_CONFIGURAR_USUARIO = "/settings";

export function esErrorSinConfigurar(e: DomainError | null): boolean {
  return e !== null && (CODIGOS_SIN_CONFIGURAR as readonly string[]).includes(e.code);
}
