import { DomainError } from "../errors";

const SEGMENTOS = [
  "LEAL_POR_LIQUIDAR",
  "DORMIDO_VALIOSO",
  "ACTIVO",
  "NUEVO",
  "FRIO",
  "PERDIDO",
] as const;

export type SegmentoValue = (typeof SEGMENTOS)[number];

export class Segmento {
  private constructor(public readonly value: SegmentoValue) {}

  static create(input: string): Segmento | DomainError {
    if ((SEGMENTOS as readonly string[]).includes(input)) {
      return new Segmento(input as SegmentoValue);
    }
    return new DomainError(
      "segmento_invalido",
      `segmento inválido: ${input}`,
    );
  }

  static values(): readonly SegmentoValue[] {
    return SEGMENTOS;
  }

  equals(other: Segmento): boolean {
    return this.value === other.value;
  }
}
