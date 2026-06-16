import type { SegmentoValue, EstadoPagoValue } from "../../domain/values";

export type BuscarClientesInput = {
  readonly q?: string;
  readonly zona?: number;
  readonly cobrador?: number;
  readonly conSaldo?: boolean;
  readonly segmento?: SegmentoValue;
  readonly estadoPago?: EstadoPagoValue;
  readonly scoreMin?: number;
  readonly sortBy?: string;
  readonly sortOrder?: "asc" | "desc";
  readonly cursor?: string;
  readonly limit?: number;
};
