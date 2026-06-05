import { DomainError } from "../errors";
import type { Monto } from "./Monto";

export type FrecPago = "SEMANAL" | "QUINCENAL" | "MENSUAL";

export class PlanCredito {
  private constructor(
    public readonly plazoMeses: number,
    public readonly enganche: Monto,
    public readonly parcialidad: Monto,
    public readonly frecPago: FrecPago,
  ) {}

  static create(input: {
    plazoMeses: number;
    enganche: Monto;
    parcialidad: Monto;
    frecPago: FrecPago;
  }): PlanCredito | DomainError {
    if (!Number.isInteger(input.plazoMeses) || input.plazoMeses < 1) {
      return new DomainError("plazo_meses_invalido", "el plazo en meses debe ser un entero mayor o igual a 1");
    }
    return new PlanCredito(input.plazoMeses, input.enganche, input.parcialidad, input.frecPago);
  }
}
