import type { SegmentoValue, EstadoPagoValue } from "../../domain/values";

export type BuscarClientesInput = {
  readonly q?: string;
  readonly zona?: number;
  readonly cobrador?: number;
  readonly conSaldo?: boolean;
  readonly segmento?: SegmentoValue;
  readonly estadoPago?: EstadoPagoValue;
  readonly scoreMin?: number;
  readonly cursor?: string;
  readonly limit?: number;
};
