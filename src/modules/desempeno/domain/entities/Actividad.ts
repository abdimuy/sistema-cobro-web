import type { EstadoCuenta, Trato } from "../values/estadoCuenta";

export const TIPOS_ACTIVIDAD = ["pago", "visita", "condonacion"] as const;
export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number];

export const FORMAS_COBRO = [
  "efectivo",
  "transferencia",
  "cheque",
  "condonacion",
  "otra",
] as const;
export type FormaCobro = (typeof FORMAS_COBRO)[number];

export type OrigenRegistro = "app" | "oficina";

export type RegistradoPor = {
  readonly usuarioUid: string | null;
  readonly cobradorId: number | null;
  readonly nombre: string;
  readonly origen: OrigenRegistro;
};

export type PagoDeActividad = {
  readonly importe: string;
  readonly formaCobro: FormaCobro;
  readonly formaCobroId: number;
  readonly aplicado: boolean;
  readonly rechazado: boolean;
  readonly doctoCcId: number | null;
  readonly pagoRecibidoId: string | null;
};

// VisitaDeActividad: `trato` y `etiqueta` los manda el servidor (contrato v2),
// con la misma etiqueta que muestra el teléfono. El escritorio no los deriva
// del literal `tipoVisita` (D10).
export type VisitaDeActividad = {
  readonly visitaId: string;
  readonly tipoVisita: string;
  readonly nota: string | null;
  readonly estado: EstadoCuenta;
  readonly trato: Trato;
  readonly etiqueta: string;
};

// Actividad: un pago, una visita o una condonación (contrato §1). `hora` es la
// que registró el teléfono (o Microsip), RFC3339 UTC. `capturaTardia` la decide
// el servidor (recibido_at − hora ≥ 2 h); `doctoPvId` abre el detalle de venta
// de Clientes.
export type Actividad = {
  readonly id: string;
  readonly tipo: TipoActividad;
  readonly hora: string;
  readonly recibidoAt: string | null;
  readonly clienteId: number;
  readonly clienteNombre: string;
  readonly ventaId: number | null;
  readonly folio: string | null;
  readonly registradoPor: RegistradoPor;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly conGps: boolean;
  readonly numFotos: number;
  readonly doctoPvId: number | null;
  readonly capturaTardia: boolean;
  readonly pago: PagoDeActividad | null;
  readonly visita: VisitaDeActividad | null;
};

// RefImagenes: a qué recurso del API se le piden las fotos.
export type RefImagenes =
  | { readonly tipo: "pago"; readonly pagoRecibidoId: string }
  | { readonly tipo: "visita"; readonly visitaId: string };

// refImagenesDeActividad decide de dónde salen las fotos de una actividad.
// Un pago sin pago_recibido_id (anterior a 2.18.0, Microsip o legado) no tiene
// fotos que pedir: la pantalla dice "Sin comprobante" (spec §6).
export function refImagenesDeActividad(a: Actividad): RefImagenes | null {
  if (a.numFotos === 0) return null;
  if (a.visita) return { tipo: "visita", visitaId: a.visita.visitaId };
  if (a.pago?.pagoRecibidoId) {
    return { tipo: "pago", pagoRecibidoId: a.pago.pagoRecibidoId };
  }
  return null;
}
