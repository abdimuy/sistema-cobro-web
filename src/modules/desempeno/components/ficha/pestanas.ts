export const PESTANAS = ["jornada", "actividad", "cuentas"] as const;
export type PestanaFicha = (typeof PESTANAS)[number];

export function esPestana(v: unknown): v is PestanaFicha {
  return typeof v === "string" && (PESTANAS as readonly string[]).includes(v);
}
