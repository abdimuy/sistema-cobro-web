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
};
