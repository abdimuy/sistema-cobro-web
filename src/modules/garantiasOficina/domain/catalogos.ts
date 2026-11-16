export interface TransicionGarantia {
  readonly origen: string;
  readonly etapa: string;
  readonly siguientes: readonly string[];
}

export interface CatalogosGarantias {
  readonly etapas: readonly string[];
  readonly ubicaciones: readonly string[];
  readonly estados: readonly string[];
  readonly tipos_evento: readonly string[];
  readonly transiciones: readonly TransicionGarantia[];
}
