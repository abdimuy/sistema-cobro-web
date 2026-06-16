// Pago is a single payment entry in a sale's payment history.
// importe is a decimal string — do not parse to number; use Intl for display.
export type Pago = {
  readonly doctoCcId: number;
  readonly fecha: Date;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly importe: string;
  readonly formaCobro: string;
};
