// ProductoVenta is a single line item in a sale detail.
// All numeric monetary fields are kept as decimal strings.
export type ProductoVenta = {
  readonly articuloId: number;
  readonly nombre: string;
  // Decimal as string — quantity can have up to 5 decimal places.
  readonly unidades: string;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly precioUnitario: string;
  readonly precioTotalNeto: string;
  readonly pctjeDscto: string;
};
