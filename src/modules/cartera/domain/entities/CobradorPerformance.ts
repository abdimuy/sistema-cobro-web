export type CobradorPerformance = {
  readonly cobradorId: number;
  readonly zonaClienteId: number;
  readonly cei: string;
  readonly par: string;
  readonly pctCorriente: string;
  readonly saldoTotal: string;
  readonly saldoMoroso: string;
  readonly cuentasTotal: number;
  readonly importeColectado: string;
};
