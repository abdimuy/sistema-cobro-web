import type { SegmentoValue, EstadoPagoValue } from "../values";

// Cliente is the domain entity representing a single row in the client
// directory list. Money fields (saldo) are kept as decimal strings —
// formatting to locale currency happens in the presentation layer via Intl.
//
// segmento and estadoPago are null when tienePulso is false (the client has
// no materialised analytics data).
export type Cliente = {
  readonly clienteId: number;
  readonly nombre: string;
  readonly zona: string;
  readonly telefono: string;
  readonly direccionCorta: string;
  readonly score: number;
  readonly segmento: SegmentoValue | null;
  readonly estadoPago: EstadoPagoValue | null;
  readonly tienePulso: boolean;
  readonly recenciaDias: number;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly saldo: string;
  readonly tierRiesgo?: string;       // undefined when tienePulso is false
  readonly pctPagosATiempo?: string;  // undefined when tienePulso is false
  readonly fechaProxPago?: string;    // undefined when tienePulso is false
  // Credit risk — undefined when no aplica (contado or no active credit)
  readonly bandaCredito?: string;     // BAJO | MEDIO | ALTO | CRITICO
  readonly scoreCredito?: number;     // 0–100, higher = lower risk
  // Repurchase propensity — undefined when no aplica
  readonly bandaRecompra?: string;    // ALTA | MEDIA | BAJA
  readonly scoreRecompra?: number;    // 0–100, higher = more likely
  // Customer Lifetime Value — undefined when no aplica; decimal as string
  readonly clv?: string;
  readonly bandaClv?: string;         // ALTO | MEDIO | BAJO
};
