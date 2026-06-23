// RutaResumenDTO matches the backend response shape for GET /v2/rutas.
// All field names are snake_case to match the backend JSON.
export type RutaResumenDTO = {
  zona_id: number;
  zona_nombre: string;
  cobrador_id: number | null;
  cobrador_nombre: string;
  num_clientes: number;
  // Decimal string — never parse to number.
  saldo_total: string;
  pct_cobertura_semanal: string | null;
  pct_ponderado_semanal: string | null;
  fecha_inicio_semana: string | null;
};

export type RutasListResponseDTO = {
  items: RutaResumenDTO[];
};

export interface VentaCobranzaDTO {
  venta_id: number;
  cliente_id: number;
  parcialidad: string;
  frecuencia: string;
  abono_semana: string;
  vencidas: string;
  aporte: string;
  saldo: string;
  aplica_ponderado: boolean;
}

export interface DesgloseCobranzaDTO {
  zona_id: number;
  fecha_inicio_semana: string | null;
  items: VentaCobranzaDTO[];
}
