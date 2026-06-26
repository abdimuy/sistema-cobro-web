export interface IntervaloEstimado {
  punto: number;
  lo: number;
  hi: number;
}

export interface Predicciones {
  disponible: boolean;
  pAlive: IntervaloEstimado;            // [0,1]
  comprasEsperadas12m: IntervaloEstimado;
  clv: IntervaloEstimado;               // pesos as number (parsed from string)
  proximaCompraDias: IntervaloEstimado;
  draws: number;
}
