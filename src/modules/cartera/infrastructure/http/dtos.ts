// Wire-format DTO types for the cartera API endpoints.
// snake_case field names mirror the Go backend JSON output exactly.
// No domain imports here — mapping is handled by the mapper layer.

export type CarteraFiltersParams = {
  zona?: string;
  cobrador?: string;
  periodo?: string;
};

export type SaludCarteraDTO = {
  saldo_total: string;
  saldo_moroso: string;
  par: string;
  cei_rate: string;
  importe_colectado: string;
  cuentas_total: number;
  cuentas_en_mora: number;
  margen_real_proxy: string;
};

export type AgingBucketDTO = {
  bucket: string;
  saldo: string;
  conteo: number;
  pct_saldo: string;
};

export type AgingResponseDTO = {
  items: AgingBucketDTO[];
};

export type CosechaDTO = {
  cohort_month: number;
  age_months: number;
  saldo: string;
  conteo: number;
};

export type CosechasResponseDTO = {
  items: CosechaDTO[];
};

export type CobradorPerformanceDTO = {
  cobrador_id: number;
  cobrador_nombre: string;
  zona_cliente_id: number;
  cei: string;
  par: string;
  pct_corriente: string;
  saldo_total: string;
  saldo_moroso: string;
  cuentas_total: number;
  importe_colectado: string;
};

export type CobradoresResponseDTO = {
  items: CobradorPerformanceDTO[];
};

export type CuentaRiesgoDTO = {
  cliente_id: number;
  nombre: string;
  zona: string;
  tier_riesgo: string;
  segmento: string;
  estado_pago: string;
  saldo: string;
  dias_atraso_prom: number;
  pct_pagos_a_tiempo: string;
  cadencia_dias: number;
  fecha_ultimo_pago: string; // RFC3339 or ""
  fecha_prox_pago: string;   // RFC3339 or ""
};

export type CuentasRiesgoResponseDTO = {
  items: CuentaRiesgoDTO[];
};

export type RollRateDTO = {
  disponible: boolean;
  roll_rate: number;
  fecha_corte_anterior: string; // RFC3339 or ""
  fecha_corte_reciente: string; // RFC3339 or ""
};
