import type { DomainError } from "../../domain/errors";

// Códigos 409 que reintentar no arregla y que no se configuran en Usuarios.
// El código lo lee `codigoDeError` (un solo lector) vía apperrorToDomainError.
// - semana vencida: Cuentas v2.2 de un usuario con inicio de semana de más de
//   14 días (DA-2).
// - zona excluida: la zona está en la lista de excluidas de desempeño (D20).
export const CODIGO_SEMANA_VENCIDA = "desempeno_semana_vencida";
export const CODIGO_ZONA_EXCLUIDA = "desempeno_zona_excluida";

const TITULO: Record<string, string> = {
  [CODIGO_SEMANA_VENCIDA]: "Semana vencida",
  [CODIGO_ZONA_EXCLUIDA]: "Zona excluida",
};

// Título del aviso para ese error, o null si no es uno de estos conflictos.
export function tituloConflicto(e: DomainError | null): string | null {
  return (e && TITULO[e.code]) ?? null;
}
