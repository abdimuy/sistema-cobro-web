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

// Columnas del contrato v2.2 (D18): la columna de cada cuenta la decide el
// servidor; "sin nada" no es columna sino un filtro de cobertura (DA-3).
export const COLUMNAS = ["por_visitar", "no_paga", "pagados"] as const;
export type Columna = (typeof COLUMNAS)[number];

export const ETIQUETA_COLUMNA: Record<Columna, string> = {
  por_visitar: "Por visitar",
  no_paga: "No paga",
  pagados: "Pagados",
};

export const esEstadoCuenta = (v: unknown): v is EstadoCuenta => esUno(ESTADOS_CUENTA, v);
export const esTrato = (v: unknown): v is Trato => esUno(TRATOS, v);
export const esColumna = (v: unknown): v is Columna => esUno(COLUMNAS, v);
