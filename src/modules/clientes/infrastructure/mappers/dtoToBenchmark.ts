import type { Benchmark, MetricaBenchmark, CohortBy } from "../../domain/entities/Benchmark";
import type { BenchmarkDto, MetricaDto, MetricaMoneyDto } from "../http/dtos";

const VALID_COHORT_BY: readonly CohortBy[] = ["zona", "segmento", "antiguedad"] as const;

function parseCohortBy(raw: string): CohortBy {
  return (VALID_COHORT_BY as readonly string[]).includes(raw)
    ? (raw as CohortBy)
    : "zona";
}

function mapMetrica(dto: MetricaDto): MetricaBenchmark {
  return {
    aplica: dto.aplica,
    valor: dto.valor,
    percentil: dto.percentil,
    mediana: dto.mediana,
    p25: dto.p25,
    p75: dto.p75,
    n: dto.n,
    muestraPequena: dto.muestra_pequena,
  };
}

function mapMetricaMoney(dto: MetricaMoneyDto): MetricaBenchmark {
  return {
    aplica: dto.aplica,
    valor: Number(dto.valor),
    percentil: dto.percentil,
    mediana: Number(dto.mediana),
    p25: Number(dto.p25),
    p75: Number(dto.p75),
    n: dto.n,
    muestraPequena: dto.muestra_pequena,
  };
}

export function dtoToBenchmark(dto: BenchmarkDto): Benchmark {
  return {
    disponible: dto.disponible,
    cohortBy: parseCohortBy(dto.cohort_by),
    zona: dto.zona,
    n: dto.n,
    puntualidad: mapMetrica(dto.puntualidad),
    clv: mapMetricaMoney(dto.clv),
    credito: mapMetrica(dto.credito),
    recompra: mapMetrica(dto.recompra),
  };
}
