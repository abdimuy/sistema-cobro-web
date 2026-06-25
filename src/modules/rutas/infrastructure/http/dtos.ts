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

// ReporteUsuarioDTO matches GET /v2/rutas/reporte-usuarios.
// One row per active cobrador. snake_case to match backend JSON.
export type ReporteUsuarioDTO = {
  uid: string;
  nombre: string;
  email: string;
  cobrador_id: number;
  zona_id: number;
  zona_nombre: string;
  num_clientes: number;
  // Decimal string — never parse to number.
  saldo_total: string;
  pct_cobertura_semanal: string | null;
  pct_ponderado_semanal: string | null;
  // Counts behind the percentages (numerador/divisor), for transparency.
  cobertura_num: number;
  cobertura_den: number;
  ponderado_den: number;
  // RFC3339.
  fecha_inicio_semana: string;
};

export type ReporteUsuariosListResponseDTO = {
  items: ReporteUsuarioDTO[];
};

export interface VentaCobranzaDTO {
  venta_id: number;
  cliente_id: number;
  cliente_nombre: string;
  folio: string;
  docto_pv_id: number;
  parcialidad: string;
  frecuencia: string;
  abono_semana: string;
  vencidas: string;
  aporte: string;
  saldo: string;
  aplica_ponderado: boolean;
  atraso_antes_cuotas: string;
  atraso_antes_pesos: string;
  pago_cuotas: string;
  atraso_despues_cuotas: string;
  atraso_despues_pesos: string;
}

export interface DesgloseCobranzaDTO {
  zona_id: number;
  fecha_inicio_semana: string | null;
  items: VentaCobranzaDTO[];
  resumen: {
    numerador: string;
    denominador: number;
    pct_ponderado: string | null;
  };
}
