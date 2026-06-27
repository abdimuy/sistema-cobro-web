import type { CobradorPerformance } from "../../domain/entities/CobradorPerformance";
import type { CobradorPerformanceDTO } from "../http/dtos";

export function dtoToCobradorPerformance(dto: CobradorPerformanceDTO): CobradorPerformance {
  return {
    cobradorId: dto.cobrador_id,
    zonaClienteId: dto.zona_cliente_id,
    cei: dto.cei,
    par: dto.par,
    pctCorriente: dto.pct_corriente,
    saldoTotal: dto.saldo_total,
    saldoMoroso: dto.saldo_moroso,
    cuentasTotal: dto.cuentas_total,
    importeColectado: dto.importe_colectado,
  };
}
