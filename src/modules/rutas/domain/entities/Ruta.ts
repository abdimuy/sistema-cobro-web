// Ruta represents a single zona/ruta entry from the backend.
// Money fields are kept as decimal strings throughout the domain —
// formatting to locale currency happens in the presentation layer via Intl.
export type Ruta = {
  readonly zonaId: number;
  readonly zonaNombre: string;
  readonly cobradorNombre: string;
  readonly numClientes: number;
  // Decimal as string — do not parse to number; use formatMoney for display.
  readonly saldoTotal: string;
  // Percentage strings — null when no weekly data available yet.
  readonly pctCoberturaSemanal: string | null;
  readonly pctPonderadoSemanal: string | null;
  readonly fechaInicioSemana: string | null;
};
