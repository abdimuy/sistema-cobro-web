import type { SegmentoValue, EstadoPagoValue } from "../values";

// PuntoMensual is a single (year, month, amount) point for monthly series.
export type PuntoMensual = {
  readonly anio: number;
  readonly mes: number;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly monto: string;
};

// PuntoCompradoAbonado is a (year, month) data point: the gross purchased amount
// plus the paid amount broken down by category (matches the backend buckets).
// All monetary fields are decimal strings — do not parse to number; use Intl for
// display. The sum of the five category buckets is the month's total abonado.
export type PuntoCompradoAbonado = {
  readonly anio: number;
  readonly mes: number;
  readonly comprado: string;
  readonly cobranza: string;
  readonly enganche: string;
  readonly condonacion: string;
  readonly perdida: string;
  readonly otro: string;
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
  // Credit risk intelligence — undefined when no aplica (contado or no active credit)
  readonly bandaCredito?: string;           // BAJO | MEDIO | ALTO | CRITICO
  readonly scoreCredito?: number;           // 0–100, higher = lower risk
  readonly creditoDrivers?: readonly string[]; // up to 3 Spanish risk reasons
  // Repurchase propensity — undefined when no aplica
  readonly bandaRecompra?: string;          // ALTA | MEDIA | BAJA
  readonly scoreRecompra?: number;          // 0–100, higher = more likely
  readonly recompraDrivers?: readonly string[]; // up to 3 Spanish propensity reasons
  // Customer Lifetime Value — undefined when no aplica; decimal as string
  readonly clv?: string;
  readonly bandaClv?: string;               // ALTO | MEDIO | BAJO
};

// DireccionCliente holds the address components for a client.
export type DireccionCliente = {
  readonly calle: string;
  readonly colonia: string;
  readonly poblacion: string;
  readonly estado: string;
};

// UbicacionCliente holds the GPS coordinates for a client.
// disponible is false when the client has no GPS data (~68% of clients).
export type UbicacionCliente = {
  readonly lat: number;
  readonly lng: number;
  readonly disponible: boolean;
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
  readonly ubicacion: UbicacionCliente;
};
