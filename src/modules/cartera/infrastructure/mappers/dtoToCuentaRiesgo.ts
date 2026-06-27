import { DomainError } from "../../domain/errors";
import type { CuentaRiesgo } from "../../domain/entities/CuentaRiesgo";
import type { CuentaRiesgoDTO } from "../http/dtos";

function parseDate(raw: string, field: string): Date | null {
  if (raw === "") return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new DomainError(`${field}_invalida`, `${field} no es un timestamp válido`);
  }
  return d;
}

export function dtoToCuentaRiesgo(dto: CuentaRiesgoDTO): CuentaRiesgo {
  return {
    clienteId: dto.cliente_id,
    nombre: dto.nombre,
    zona: dto.zona,
    tierRiesgo: dto.tier_riesgo,
    segmento: dto.segmento,
    estadoPago: dto.estado_pago,
    saldo: dto.saldo,
    diasAtrasoProm: dto.dias_atraso_prom,
    pctPagosATiempo: dto.pct_pagos_a_tiempo,
    cadenciaDias: dto.cadencia_dias,
    fechaUltimoPago: parseDate(dto.fecha_ultimo_pago, "fecha_ultimo_pago"),
    fechaProxPago: parseDate(dto.fecha_prox_pago, "fecha_prox_pago"),
  };
}
