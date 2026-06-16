import type { TipoVentaValue } from "../values";

// VentaCliente is the domain entity representing a single sale header in the
// client's sales list. Money fields (total, saldoVenta) are decimal strings.
export type VentaCliente = {
  readonly doctoPvId: number;
  readonly fecha: Date;
  readonly folio: string;
  readonly tipo: TipoVentaValue;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly total: string;
  readonly saldoVenta: string;
  readonly numPagos: number;
};
