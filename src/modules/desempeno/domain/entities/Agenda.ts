import { esUno } from "../values/esUno";

// Compromiso vigente de una venta según la agenda del servidor
// (GET /v2/visitas/agenda, visitas P2 spec §5.3.2 y §5.5). El estado lo deriva
// el servidor y nunca se guarda ni se recalcula aquí: el escritorio solo lo
// pinta (memoria feedback_logica_siempre_en_servidor).
export const TIPOS_COMPROMISO = ["promesa", "cita"] as const;
export type TipoCompromiso = (typeof TIPOS_COMPROMISO)[number];
export const esTipoCompromiso = (v: unknown): v is TipoCompromiso => esUno(TIPOS_COMPROMISO, v);

export const ESTADOS_COMPROMISO = [
  "cumplida",
  "cita_cumplida",
  "vigente_futura",
  "vigente_hoy",
  "incumplida",
  "cerrada_sin_cumplir",
] as const;
export type EstadoCompromiso = (typeof ESTADOS_COMPROMISO)[number];
export const esEstadoCompromiso = (v: unknown): v is EstadoCompromiso => esUno(ESTADOS_COMPROMISO, v);

export type CompromisoDeVenta = {
  readonly ventaId: number;
  readonly tipo: TipoCompromiso;
  readonly estado: EstadoCompromiso;
  // Día civil "AAAA-MM-DD" y hora civil "HH:MM" tal como los manda el servidor.
  readonly dia: string;
  readonly hora: string | null;
  readonly montoCentavos: number | null;
};

// Agenda de una zona: un compromiso por venta (venta_id = DOCTO_CC_ID de
// MSP_SALDOS_VENTAS, el mismo id que `Cuenta.ventaId`). Ventas sin compromiso
// no aparecen.
export type Agenda = ReadonlyMap<number, CompromisoDeVenta>;
