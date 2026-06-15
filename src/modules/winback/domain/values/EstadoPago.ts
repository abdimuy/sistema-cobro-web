import { DomainError } from "../errors";

const ESTADOS_PAGO = [
  "AL_CORRIENTE",
  "ATRASADO",
  "MOROSO",
  "LIQUIDADO",
  "SIN_CREDITO",
] as const;

export type EstadoPagoValue = (typeof ESTADOS_PAGO)[number];

export class EstadoPago {
  private constructor(public readonly value: EstadoPagoValue) {}

  static create(input: string): EstadoPago | DomainError {
    if ((ESTADOS_PAGO as readonly string[]).includes(input)) {
      return new EstadoPago(input as EstadoPagoValue);
    }
    return new DomainError(
      "estado_pago_invalido",
      `estado de pago inválido: ${input}`,
    );
  }

  static values(): readonly EstadoPagoValue[] {
    return ESTADOS_PAGO;
  }

  equals(other: EstadoPago): boolean {
    return this.value === other.value;
  }
}
