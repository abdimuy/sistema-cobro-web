import { DomainError } from "../../domain/errors";
import type { RollRate } from "../../domain/entities/RollRate";
import type { RollRateDTO } from "../http/dtos";

function parseDate(raw: string, field: string): Date | null {
  if (raw === "") return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new DomainError(`${field}_invalida`, `${field} no es un timestamp válido`);
  }
  return d;
}

export function dtoToRollRate(dto: RollRateDTO): RollRate {
  return {
    disponible: dto.disponible,
    rollRate: dto.roll_rate,
    fechaCorteAnterior: parseDate(dto.fecha_corte_anterior, "fecha_corte_anterior"),
    fechaCorteReciente: parseDate(dto.fecha_corte_reciente, "fecha_corte_reciente"),
  };
}
