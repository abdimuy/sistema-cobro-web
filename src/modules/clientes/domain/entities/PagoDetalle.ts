import type { CategoriaPago } from "../values/CategoriaPago";

// PagoDetalle is the full detail of a single payment (CC document).
// Decimal amounts are kept as strings — do not parse to number; use Intl for display.
export type PagoDetalle = {
  readonly importe: string;
  readonly iva: string;
  readonly fecha: Date;
  readonly formaCobroId: number;
  readonly formaCobro: string;
  readonly referencia: string;
  readonly cobradorId: number;
  readonly cobrador: string;
  readonly conceptoCcId: number;
  readonly concepto: string;
  readonly categoria: CategoriaPago;
  readonly esIngreso: boolean;
  readonly folio: string;
  readonly lat: number | null;
  readonly lon: number | null;
  readonly aplicaACargoId: number;
  readonly saldoCargo: string | null;
  readonly doctoPvId: number;
  readonly cancelado: boolean;
  readonly aplicado: boolean;
  readonly recibidoAt: Date | null;
  readonly aplicadoAt: Date | null;
  readonly origen: "app" | "microsip";
};
