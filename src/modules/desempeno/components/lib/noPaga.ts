// Bandera de presentación de la columna "No paga" (decisión del dueño
// 2026-10-19, opción B). Se enciende cuando el API reciba la fecha de la
// promesa (parte 2 de visitas); hasta entonces el servidor manda no_paga = 0 y
// esos clientes caen en "Por visitar". El contrato sigue leyendo y validando
// no_paga: esto solo decide qué se pinta.
export const MOSTRAR_NO_PAGA = false;

// Con la bandera apagada, "No paga" se pinta igual si el servidor manda cuentas
// en esa columna (> 0): esconderla dejaría esas cuentas sin lugar en la lista,
// porque "Por visitar" no las trae.
export function noPagaVisible(mostrar: boolean, n: number | null | undefined): boolean {
  return mostrar || (n ?? 0) > 0;
}
