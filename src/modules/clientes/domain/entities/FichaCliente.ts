import type { SegmentoValue, EstadoPagoValue } from "../values";

// PuntoMensual is a single (year, month, amount) point for monthly series.
export type PuntoMensual = {
  readonly anio: number;
  readonly mes: number;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly monto: string;
};

// PuntoCompradoAbonado is a dual-series (year, month) data point for charts.
export type PuntoCompradoAbonado = {
  readonly anio: number;
  readonly mes: number;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly comprado: string;
  readonly abonado: string;
};

// ResumenFicha holds the aggregated financial KPIs shown in the ficha header.
export type ResumenFicha = {
  readonly totalComprado: string;
  readonly totalAbonado: string;
  readonly saldo: string;
  readonly pctLiquidado: string;
  readonly numVentas: number;
  readonly numPagos: number;
  readonly ticketPromedio: string;
  readonly abonosPorMes: PuntoMensual[];
  readonly compradoVsAbonado: PuntoCompradoAbonado[];
};

// Pulso holds the analytics signal for a client. Only present when the client
// has materialised analytics data (FichaCliente.pulso !== null).
//
// Money fields (monetary, saldo, porLiquidarPct, montoProxPago) are decimal strings.
// Dates are null when there is no purchase or payment history.
export type Pulso = {
  readonly score: number;
  readonly segmento: SegmentoValue;
  readonly estadoPago: EstadoPagoValue;
  readonly recenciaDias: number;
  readonly frecuencia: number;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly monetary: string;
  readonly saldo: string;
  readonly porLiquidarPct: string;
  readonly fechaUltimaCompra: Date | null;
  readonly fechaUltimoPago: Date | null;
  readonly nextBestProduct: string;
  // Cobranza intelligence
  readonly numPagos: number;
  readonly cadenciaDias: number;
  readonly diasAtrasoProm: number;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly pctPagosATiempo: string;
  readonly fechaProxPago: Date | null;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly montoProxPago: string;
  readonly tierRiesgo: string;
};

// DireccionCliente holds the address components for a client.
export type DireccionCliente = {
  readonly calle: string;
  readonly colonia: string;
  readonly poblacion: string;
  readonly estado: string;
};

// FichaCliente is the full 360-degree view of a client, combining Microsip
// master data, aggregated financial KPIs, time-series data, and analytics
// pulse. pulso is null when the client has no materialised analytics data.
export type FichaCliente = {
  readonly clienteId: number;
  readonly nombre: string;
  readonly direccion: DireccionCliente;
  readonly telefono: string;
  readonly limiteCredito: string;
  readonly notas: string;
  readonly zona: string;
  readonly cobrador: string;
  readonly estatus: string;
  readonly resumen: ResumenFicha;
  readonly pulso: Pulso | null;
};
