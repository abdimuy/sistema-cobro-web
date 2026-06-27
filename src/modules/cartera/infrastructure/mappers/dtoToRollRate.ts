import type { RollRate } from "../../domain/entities/RollRate";
import type { RollRateDTO } from "../http/dtos";
import { parseDate } from "./lib/parseDate";

export function dtoToRollRate(dto: RollRateDTO): RollRate {
  return {
    disponible: dto.disponible,
    rollRate: dto.roll_rate,
    fechaCorteAnterior: parseDate(dto.fecha_corte_anterior, "fecha_corte_anterior"),
    fechaCorteReciente: parseDate(dto.fecha_corte_reciente, "fecha_corte_reciente"),
  };
}
