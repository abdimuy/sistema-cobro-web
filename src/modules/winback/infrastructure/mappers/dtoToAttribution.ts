import type { WinbackAttribution } from "../../domain/entities/WinbackAttribution";
import type { AttributionDTO } from "../http/dtos";

export function dtoToAttribution(dto: AttributionDTO): WinbackAttribution {
  return {
    treatmentTotal: dto.treatment_total,
    treatmentConvertidos: dto.treatment_convertidos,
    controlTotal: dto.control_total,
    controlConvertidos: dto.control_convertidos,
    tasaTreatment: dto.tasa_treatment,
    tasaControl: dto.tasa_control,
    uplift: dto.uplift,
  };
}
