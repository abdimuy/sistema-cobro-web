// Wire-format DTO types for the clientes API endpoints.
// These types mirror the JSON shapes returned by the backend exactly,
// using snake_case field names. They are intentionally decoupled from the
// domain layer — no domain imports here.
//
// Field names match the Go dto.go json tags verbatim.

// ─── Generic envelope ────────────────────────────────────────────────────────

export type ListResponseDTO<T> = {
  items: T[];
  next_cursor: string;
};

// ─── GET /clientes ───────────────────────────────────────────────────────────

// DirectorioFacetsDTO mirrors the backend facets payload: { facetKey: { facetValue: count } }.
export type DirectorioFacetsDTO = Record<string, Record<string, number>>;

// BuscarClientesResponseDTO extends the generic list envelope with optional facets.
export type BuscarClientesResponseDTO = ListResponseDTO<ClienteListItemDTO> & {
  facets?: DirectorioFacetsDTO;
};

export type ClienteListItemDTO = {
  cliente_id: number;
  nombre: string;
  zona: string;
  telefono: string;
  direccion_corta: string;
  score: number;
  segmento: string; // SegmentoValue — validated when mapped to domain
  estado_pago: string; // EstadoPagoValue — validated when mapped to domain
  tiene_pulso: boolean;
  recencia_dias: number;
  saldo: string; // decimal as string
  tier_riesgo: string;       // AL_DIA | VIGILANCIA | EN_RIESGO | CRITICO; empty when no pulse
  pct_pagos_a_tiempo: string; // decimal string, empty when no pulse
  fecha_prox_pago: string;    // RFC3339, empty when no pulse
};

// ─── GET /clientes/{id} ──────────────────────────────────────────────────────

export type DireccionDTO = {
  calle: string;
  colonia: string;
  poblacion: string;
  estado: string;
};

export type ResumenDTO = {
  total_comprado: string;
  total_abonado: string;
  saldo: string;
  pct_liquidado: string;
  ticket_promedio: string;
  num_ventas: number;
  num_pagos: number;
};

export type PuntoMensualDTO = {
  anio: number;
  mes: number;
  monto: string; // decimal as string
};

export type PuntoCompradoAbonadoDTO = {
  anio: number;
  mes: number;
  comprado: string; // decimal as string
  abonado: string; // decimal as string
};

export type SeriesDTO = {
  abonos_por_mes: PuntoMensualDTO[];
  comprado_vs_abonado: PuntoCompradoAbonadoDTO[];
};

export type PulsoDTO = {
  score: number;
  segmento: string; // SegmentoValue — validated when mapped to domain
  estado_pago: string; // EstadoPagoValue — validated when mapped to domain
  recencia_dias: number;
  frecuencia: number;
  monetary: string; // decimal as string
  saldo: string; // decimal as string
  por_liquidar_pct: string; // decimal as string
  fecha_ultima_compra: string; // RFC3339; empty when no purchase history
  fecha_ultimo_pago: string; // RFC3339; empty when no payment history
  next_best_product: string;
};

export type FichaDTO = {
  cliente_id: number;
  nombre: string;
  direccion: DireccionDTO;
  telefono: string;
  limite_credito: string; // decimal as string
  notas: string;
  zona: string;
  cobrador: string;
  estatus: string;
  resumen: ResumenDTO;
  series: SeriesDTO;
  pulso: PulsoDTO | null; // null when no materialised analytics data
};

// ─── GET /clientes/{id}/ventas ───────────────────────────────────────────────

export type VentaListItemDTO = {
  docto_pv_id: number;
  fecha: string; // RFC3339
  folio: string;
  tipo: string; // TipoVentaValue — validated when mapped to domain
  total: string; // decimal as string
  saldo_venta: string; // decimal as string
  num_pagos: number;
};

// ─── GET /clientes/{id}/ventas/{doctoPvId} ───────────────────────────────────

export type VentaHeaderDTO = {
  docto_pv_id: number;
  cliente_id: number;
  fecha: string; // RFC3339
  folio: string;
  tipo: string; // TipoVentaValue — validated when mapped to domain
  total: string; // decimal as string
  saldo_venta: string; // decimal as string
  num_pagos: number;
};

export type ProductoVentaDTO = {
  articulo_id: number;
  nombre: string;
  unidades: string; // decimal as string (up to 5 decimal places)
  precio_unitario: string; // decimal as string
  precio_total_neto: string; // decimal as string
  pctje_dscto: string; // decimal as string
};

export type ContratoDTO = {
  parcialidad: string; // decimal as string
  enganche: string; // decimal as string
  precio_de_contado: string; // decimal as string
  plazo_meses: number;
  forma_de_pago: string;
  vendedores: string[];
};

export type PagoDTO = {
  docto_cc_id: number;
  fecha: string; // RFC3339
  importe: string; // decimal as string
  forma_cobro: string;
};

export type VentaDetalleDTO = {
  venta: VentaHeaderDTO;
  productos: ProductoVentaDTO[];
  contrato: ContratoDTO | null; // null for cash sales
  pagos: PagoDTO[];
};

// ─── POST /clientes/_search/refresh ──────────────────────────────────────────

export type RefrescarBusquedaResponseDTO = {
  reindexado: boolean;
  documentos: number;
};
