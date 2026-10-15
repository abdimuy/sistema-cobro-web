// Rotulación de los atrasos de una cuenta, con los MISMOS tramos y textos que
// el teléfono (msp-app-kt `PiezasDeLaLista.kt`, `PastillaDeAtrasos` y
// `textoDeAtrasos`): menos de 1 → "Al corriente" en verde; 1–4 → ámbar; 5 o
// más → rojo. Un número negativo (cuenta adelantada) también es "Al corriente".
// Solo presentación: el número lo manda el servidor y el orden sigue usándolo.

export const ATRASOS_GRAVES = 5;

export type TonoAtrasos = "ok" | "ambar" | "rojo";

export function textoDeAtrasos(n: number): string {
  if (n < 1) return "Al corriente";
  return n === 1 ? "1 atraso" : `${n} atrasos`;
}

export function tonoDeAtrasos(n: number): TonoAtrasos {
  if (n < 1) return "ok";
  return n < ATRASOS_GRAVES ? "ambar" : "rojo";
}

export const CLASE_TONO_ATRASOS: Record<TonoAtrasos, string> = {
  ok: "text-dsm-ok",
  ambar: "text-dsm-ambar",
  rojo: "text-dsm-rojo",
};
