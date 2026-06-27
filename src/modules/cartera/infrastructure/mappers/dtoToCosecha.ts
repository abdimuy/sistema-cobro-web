import type { Cosecha } from "../../domain/entities/Cosecha";
import type { CosechaDTO } from "../http/dtos";

export function dtoToCosecha(dto: CosechaDTO): Cosecha {
  return {
    cohortMonth: dto.cohort_month,
    ageMonths: dto.age_months,
    saldo: dto.saldo,
    conteo: dto.conteo,
  };
}
