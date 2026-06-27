export type CuentaRiesgo = {
  readonly clienteId: number;
  readonly nombre: string;
  readonly zona: string;
  readonly tierRiesgo: string;
  readonly segmento: string;
  readonly estadoPago: string;
  readonly saldo: string;
  readonly diasAtrasoProm: number;
  readonly pctPagosATiempo: string;
  readonly cadenciaDias: number;
  readonly fechaUltimoPago: Date | null;
  readonly fechaProxPago: Date | null;
};
