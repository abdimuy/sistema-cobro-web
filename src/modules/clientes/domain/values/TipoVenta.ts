import { DomainError } from "../errors";

const TIPOS_VENTA = ["CONTADO", "CREDITO"] as const;

export type TipoVentaValue = (typeof TIPOS_VENTA)[number];

export class TipoVenta {
  private constructor(public readonly value: TipoVentaValue) {}

  static create(input: string): TipoVenta | DomainError {
    if ((TIPOS_VENTA as readonly string[]).includes(input)) {
      return new TipoVenta(input as TipoVentaValue);
    }
    return new DomainError(
      "tipo_venta_invalido",
      `tipo de venta inválido: ${input}`,
    );
  }

  static values(): readonly TipoVentaValue[] {
    return TIPOS_VENTA;
  }

  equals(other: TipoVenta): boolean {
    return this.value === other.value;
  }
}
