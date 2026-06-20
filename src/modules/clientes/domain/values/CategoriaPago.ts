export type CategoriaPago = "pago" | "enganche" | "condonacion" | "perdida" | "otro";

const CATEGORIAS: readonly CategoriaPago[] = [
  "pago",
  "enganche",
  "condonacion",
  "perdida",
  "otro",
];

export function toCategoriaPago(s: string): CategoriaPago {
  if ((CATEGORIAS as readonly string[]).includes(s)) {
    return s as CategoriaPago;
  }
  return "otro";
}
