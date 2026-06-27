import type { SaludCartera } from "../../domain/entities/SaludCartera";
import type { SaludCarteraDTO } from "../http/dtos";

export function dtoToSaludCartera(dto: SaludCarteraDTO): SaludCartera {
  return {
    saldoTotal: dto.saldo_total,
    saldoMoroso: dto.saldo_moroso,
    par: dto.par,
    ceiRate: dto.cei_rate,
    importeColectado: dto.importe_colectado,
    cuentasTotal: dto.cuentas_total,
    cuentasEnMora: dto.cuentas_en_mora,
    margenRealProxy: dto.margen_real_proxy,
  };
}
