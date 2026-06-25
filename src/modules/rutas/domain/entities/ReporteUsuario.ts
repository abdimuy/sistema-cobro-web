// ReporteUsuario represents a single cobrador (user) row in the weekly
// cobranza report. One row per active cobrador.
// num_clientes / saldoTotal are per-ZONA (shared across users of the same
// ruta); the percentages are per-user (computed over that user's window).
// Money/percent fields are kept as decimal strings throughout the domain —
// formatting to locale happens in the presentation layer.
export type ReporteUsuario = {
  readonly uid: string;
  readonly nombre: string;
  readonly email: string;
  readonly cobradorId: number;
  readonly zonaId: number;
  readonly zonaNombre: string;
  readonly numClientes: number;
  // Decimal as string — do not parse to number; use formatMoney for display.
  readonly saldoTotal: string;
  // Percentage strings — null when no weekly data available yet.
  readonly pctCoberturaSemanal: string | null;
  readonly pctPonderadoSemanal: string | null;
  // RFC3339 start of the user's weekly window.
  readonly fechaInicioSemana: string;
};
