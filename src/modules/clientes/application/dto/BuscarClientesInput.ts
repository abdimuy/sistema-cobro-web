import type { SegmentoValue, EstadoPagoValue } from "../../domain/values";

export type BuscarClientesInput = {
  readonly q?: string;
  readonly zona?: number;
  readonly cobrador?: number;
  readonly conSaldo?: boolean;
  readonly segmento?: SegmentoValue;
  readonly estadoPago?: EstadoPagoValue;
  readonly scoreMin?: number;
  readonly tier?: string; // filter by tier_riesgo
  readonly bandaCredito?: string; // filter by banda_credito
  readonly bandaRecompra?: string; // filter by banda_recompra
  readonly bandaClv?: string; // filter by banda_clv
  readonly sortBy?: string;
  readonly sortOrder?: "asc" | "desc";
  readonly cursor?: string;
  readonly limit?: number;
};
