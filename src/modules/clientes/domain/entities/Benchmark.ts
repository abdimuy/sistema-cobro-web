export type CohortBy = "zona" | "segmento" | "antiguedad";

export interface MetricaBenchmark {
  aplica: boolean;
  valor: number;
  percentil: number;
  mediana: number;
  p25: number;
  p75: number;
  n: number;
  muestraPequena: boolean;
}

export interface Benchmark {
  disponible: boolean;
  cohortBy: CohortBy;
  zona: string;
  n: number;
  puntualidad: MetricaBenchmark;
  clv: MetricaBenchmark; // clv fields parsed from strings to numbers
  credito: MetricaBenchmark;
  recompra: MetricaBenchmark;
}
