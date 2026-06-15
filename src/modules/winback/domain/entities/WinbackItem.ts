import type { Segmento, EstadoPago, Tier } from "../values";

// WinbackItem is the domain entity representing a client candidate for
// winback outreach. It is intentionally immutable and "dumb": all business
// logic (scoring, filtering, attribution) lives in the application layer.
//
// Money fields (monetary, saldo, porLiquidarPct) are kept as decimal strings
// throughout the domain — formatting to locale currency happens in the
// presentation layer via Intl.
export type WinbackItem = {
  readonly clienteId: number;
  readonly nombre: string;
  readonly zona: string;
  readonly telefono: string;
  /** Null when the client has no purchase history. */
  readonly fechaUltimaCompra: Date | null;
  readonly recenciaDias: number;
  readonly frecuencia: number;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly monetary: string;
  readonly saldo: string;
  readonly porLiquidarPct: string;
  readonly nextBestProduct: string;
  readonly segmento: Segmento;
  readonly score: number;
  readonly enControl: boolean;
  readonly estadoPago: EstadoPago;
  /** Null when the client has no payment history. */
  readonly fechaUltimoPago: Date | null;
  readonly etiqueta: string;
  readonly resumen: string;
  readonly tier: Tier;
};
