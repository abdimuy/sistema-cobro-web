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
};

export type RutasListResponseDTO = {
  items: RutaResumenDTO[];
};
