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
  // Enriched fields from Microsip native
  readonly hora: string; // "HH:MM:SS" display string — never parse as a Date
  readonly almacen: string;
  readonly primerArticulo: string; // first J/N line article name; empty if none
  readonly numArticulos: number; // count of J/N lines
};
