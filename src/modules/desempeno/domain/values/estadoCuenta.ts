import { esUno } from "./esUno";

// Códigos fijos del contrato §1. La etiqueta y el detalle en español los arma
// el servidor; el escritorio no deriva ninguno de estos valores (D10).
export const ESTADOS_CUENTA = [
  "pago",
  "abono_parcial",
  "visite_vuelvo",
  "prometio_proxima",
  "se_nego",
  "cita_a_una_hora",
  "no_estaba",
  "sin_tocar",
] as const;
export type EstadoCuenta = (typeof ESTADOS_CUENTA)[number];

export const TRATOS = [
  "pagado",
  "parcial",
  "regresas",
  "diferido",
  "escalar",
  "cita",
  "nadie",
  "sin_trabajar",
] as const;
export type Trato = (typeof TRATOS)[number];

export const SEGMENTOS = ["sin_visitar", "volver", "despues", "pagados"] as const;
export type Segmento = (typeof SEGMENTOS)[number];

export const esEstadoCuenta = (v: unknown): v is EstadoCuenta => esUno(ESTADOS_CUENTA, v);
export const esTrato = (v: unknown): v is Trato => esUno(TRATOS, v);
export const esSegmento = (v: unknown): v is Segmento => esUno(SEGMENTOS, v);
