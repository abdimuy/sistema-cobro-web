import type { RitmoPago, SemanaRitmo, EventoRitmo, ResumenRitmo } from "../../domain/entities";
import { validateEventoTipo } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import type { RitmoPagoDTO } from "../http/dtos";

function parseRequiredDate(raw: string, code: string, message: string): Date {
  if (raw === "" || raw === undefined) {
    throw new DomainError(code, message);
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new DomainError(code, message);
  }
  return d;
}

export function dtoToRitmoPago(dto: RitmoPagoDTO): RitmoPago {
  const semanas: SemanaRitmo[] = dto.semanas.map((s) => ({
    semanaInicio: parseRequiredDate(
      s.semana_inicio,
      "semana_inicio_invalida",
      "semana_inicio no es un timestamp válido",
    ),
    montoAbonado: s.monto_abonado,
    saldo: s.saldo,
    numPagos: s.num_pagos,
    pagoIds: s.pago_ids ?? [],
  }));

  const eventos: EventoRitmo[] = dto.eventos.map((e) => ({
    fecha: parseRequiredDate(
      e.fecha,
      "evento_fecha_invalida",
      "fecha de evento no es un timestamp válido",
    ),
    tipo: validateEventoTipo(e.tipo),
    monto: e.monto,
    doctoPvId: e.docto_pv_id,
    folio: e.folio,
    plazoMeses: e.plazo_meses,
  }));

  const resumen: ResumenRitmo = {
    totalAbonado: dto.resumen.total_abonado,
    semanasConPago: dto.resumen.semanas_con_pago,
    semanasActivas: dto.resumen.semanas_activas,
    rachaActualSem: dto.resumen.racha_actual_sem,
    constanciaPct: dto.resumen.constancia_pct,
    saldoActual: dto.resumen.saldo_actual,
  };

  return {
    anclaDiaRuta: dto.ancla_dia_ruta,
    semanas,
    eventos,
    resumen,
  };
}
