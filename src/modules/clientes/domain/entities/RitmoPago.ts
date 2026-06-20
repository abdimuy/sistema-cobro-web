import { DomainError } from "../errors";

const EVENTO_TIPOS = ["venta_credito", "venta_contado", "liquidacion"] as const;

export type EventoTipo = (typeof EVENTO_TIPOS)[number];

export type SemanaRitmo = {
  readonly semanaInicio: Date;
  readonly montoAbonado: string;
  readonly saldo: string;
  readonly numPagos: number;
  readonly pagoIds: number[];
};

export type EventoRitmo = {
  readonly fecha: Date;
  readonly tipo: EventoTipo;
  readonly monto: string;
  readonly doctoPvId: number;
  readonly folio: string;
  readonly plazoMeses: number;
};

export type ResumenRitmo = {
  readonly totalAbonado: string;
  readonly semanasConPago: number;
  readonly semanasActivas: number;
  readonly rachaActualSem: number;
  readonly constanciaPct: string;
  readonly saldoActual: string;
};

export type RitmoPago = {
  readonly anclaDiaRuta: string;
  readonly semanas: SemanaRitmo[];
  readonly eventos: EventoRitmo[];
  readonly resumen: ResumenRitmo;
};

export function validateEventoTipo(raw: string): EventoTipo {
  if ((EVENTO_TIPOS as readonly string[]).includes(raw)) {
    return raw as EventoTipo;
  }
  throw new DomainError(
    "evento_tipo_invalido",
    `tipo de evento inválido: ${raw}`,
  );
}
