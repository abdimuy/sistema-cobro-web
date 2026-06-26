import type { Predicciones, IntervaloEstimado } from "../../domain/entities/Predicciones";
import type { PrediccionesDto, IntervaloDto, IntervaloMoneyDto } from "../http/dtos";

function mapIntervalo(dto: IntervaloDto): IntervaloEstimado {
  return { punto: dto.punto, lo: dto.lo, hi: dto.hi };
}

function mapIntervaloMoney(dto: IntervaloMoneyDto): IntervaloEstimado {
  return {
    punto: Number(dto.punto),
    lo: Number(dto.lo),
    hi: Number(dto.hi),
  };
}

export function dtoToPredicciones(dto: PrediccionesDto): Predicciones {
  return {
    disponible: dto.disponible,
    pAlive: mapIntervalo(dto.p_alive),
    comprasEsperadas12m: mapIntervalo(dto.compras_esperadas_12m),
    clv: mapIntervaloMoney(dto.clv),
    proximaCompraDias: mapIntervalo(dto.proxima_compra_dias),
    draws: dto.draws,
  };
}
