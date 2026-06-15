// Wire-format DTO types for the winback API endpoints.
// These types mirror the JSON shapes returned by the backend exactly,
// using snake_case field names. They are intentionally decoupled from the
// domain layer — no domain imports here.
//
// Mapping to domain entities is the responsibility of the infrastructure
// mapper layer (Task 3).

// WinbackItemDTO matches a single item in GET /analytics/winback { items: [] }.
export type WinbackItemDTO = {
  cliente_id: number;
  nombre: string;
  zona: string;
  telefono: string;
  fecha_ultima_compra: string; // RFC3339
  recencia_dias: number;
  frecuencia: number;
  monetary: string; // decimal as string, e.g. "12345.67"
  saldo: string; // decimal as string
  por_liquidar_pct: string; // decimal as string, e.g. "0.85"
  next_best_product: string;
  segmento: string; // SegmentoValue — validated when mapped to domain
  score: number; // 0-100
  en_control: boolean;
  estado_pago: string; // EstadoPagoValue — validated when mapped to domain
  fecha_ultimo_pago: string; // RFC3339
  etiqueta: string;
  resumen: string;
  tier: string; // "A" | "B" | "C" | "D" — validated when mapped to domain
};

// WinbackListResponseDTO is the full response body of GET /analytics/winback.
export type WinbackListResponseDTO = {
  items: WinbackItemDTO[];
};

// AttributionDTO matches the response body of GET /analytics/winback/attribution.
export type AttributionDTO = {
  treatment_total: number;
  treatment_convertidos: number;
  control_total: number;
  control_convertidos: number;
  tasa_treatment: string; // decimal as string
  tasa_control: string; // decimal as string
  uplift: string; // decimal as string
};

// RefreshResponseDTO matches the response body of POST /analytics/winback/refresh.
export type RefreshResponseDTO = {
  estado: "iniciado" | "ya_en_progreso";
  mensaje: string;
};
