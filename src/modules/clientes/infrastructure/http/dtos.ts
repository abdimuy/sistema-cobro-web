// Wire-format DTO types for the clientes API endpoints.
// These types mirror the JSON shapes returned by the backend exactly,
// using snake_case field names. They are intentionally decoupled from the
// domain layer — no domain imports here.
//
// Field names match the Go dto.go json tags verbatim.

// ─── Generic envelope ────────────────────────────────────────────────────────

export type ListResponseDTO<T> = {
  items: T[];
  // Ausente en la última página (el backend usa json omitempty).
  next_cursor?: string;
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
  banda_credito: string;      // BAJO | MEDIO | ALTO | CRITICO; "" when no aplica (contado/sin crédito)
  score_credito: number;      // 0–100, higher = lower risk; 0 when no aplica
  banda_recompra: string;     // ALTA | MEDIA | BAJA; "" when no aplica
  score_recompra: number;     // 0–100, higher = more likely; 0 when no aplica
  clv: string;                // decimal as string; "" when no aplica
  banda_clv: string;          // ALTO | MEDIO | BAJO; "" when no aplica
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
  // Cobranza intelligence fields
  num_pagos: number;
  cadencia_dias: number; // avg days between payments
  dias_atraso_prom: number; // avg lateness in days
  pct_pagos_a_tiempo: string; // decimal string, e.g. "94.68"
  fecha_prox_pago: string; // RFC3339; empty when cadence cannot be projected
  monto_prox_pago: string; // decimal as string
  tier_riesgo: string; // AL_DIA | VIGILANCIA | EN_RIESGO | CRITICO
  // Credit risk intelligence (only present when client has active credit)
  banda_credito: string;      // BAJO | MEDIO | ALTO | CRITICO; "" when no aplica
  score_credito: number;      // 0–100, higher = lower risk; 0 when no aplica
  credito_drivers: string[];  // up to 3 Spanish risk reason strings; [] when no aplica
  // Repurchase propensity (only present when client has analytics data)
  banda_recompra: string;     // ALTA | MEDIA | BAJA; "" when no aplica
  score_recompra: number;     // 0–100, higher = more likely; 0 when no aplica
  recompra_drivers: string[]; // up to 3 Spanish propensity reason strings; [] when no aplica
  // Customer Lifetime Value
  clv: string;                // decimal as string; "" when no aplica
  banda_clv: string;          // ALTO | MEDIO | BAJO; "" when no aplica
};

export type UbicacionDTO = {
  lat: number;
  lng: number;
  disponible: boolean;
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
  ubicacion: UbicacionDTO;
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
  hora: string; // "HH:MM:SS" local Microsip wall-clock — display string, not UTC
  almacen: string;
  primer_articulo: string; // first J/N line article name; empty if none
  num_articulos: number; // count of J/N lines
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
  concepto_cc_id: number;
  concepto: string;
  categoria: string;
  cobrador: string;
  es_ingreso: boolean;
};

export type VentaDetalleDTO = {
  venta: VentaHeaderDTO;
  productos: ProductoVentaDTO[];
  contrato?: ContratoDTO | null; // omitted (undefined) for cash/legacy sales; may also be null
  pagos: PagoDTO[];
};

// ─── GET /clientes/{id}/pagos/{doctoCcId} ────────────────────────────────────

export type PagoDetalleDTO = {
  importe: string;
  iva: string;
  fecha: string; // RFC3339
  forma_cobro_id: number;
  forma_cobro: string;
  referencia: string;
  cobrador_id: number;
  cobrador: string;
  concepto_cc_id: number;
  concepto: string;
  categoria: string;
  es_ingreso: boolean;
  folio: string;
  lat?: string;
  lon?: string;
  aplica_a_cargo_id: number;
  saldo_cargo?: string;
  docto_pv_id: number;
  cancelado: boolean;
  aplicado: boolean;
  recibido_at?: string; // RFC3339
  aplicado_at?: string; // RFC3339
  origen: string; // "app" | "microsip"
};

// ─── POST /clientes/_search/refresh ──────────────────────────────────────────

export type RefrescarBusquedaResponseDTO = {
  reindexado: boolean;
  documentos: number;
};

// ─── GET /clientes/{id}/ritmo-pago ──────────────────────────────────────────

export type PagoRitmoDTO = {
  docto_cc_id: number;
  fecha: string;         // RFC3339 UTC
  hora: string;          // "HH:MM:SS" Microsip local, not UTC
  importe: string;       // gross amount, 2 decimals
  concepto_cc_id: number;
  concepto: string;
  categoria: string;     // pago | enganche | condonacion | perdida | otro
  es_ingreso: boolean;
  docto_pv_id: number;   // linked PV sale; 0 if not resolvable
  folio: string;         // e.g. "AB0001775"; "" if not resolvable
};

export type SemanaRitmoDTO = {
  semana_inicio: string; // RFC3339 UTC
  monto_abonado: string; // decimal 2 dec
  saldo: string;         // decimal 2 dec
  num_pagos: number;
  pagos: PagoRitmoDTO[]; // never null; [] when no pagos
};

export type EventoRitmoDTO = {
  fecha: string;         // RFC3339 UTC
  tipo: string;          // "venta_credito" | "venta_contado" | "liquidacion"
  monto: string;         // decimal 2 dec
  docto_pv_id: number;
  folio: string;
  plazo_meses: number;
};

export type ResumenRitmoDTO = {
  total_abonado: string;    // decimal 2 dec — income only (excludes condonacion/perdida)
  total_perdonado: string;  // decimal 2 dec — condonacion + perdida
  semanas_con_pago: number;
  semanas_activas: number;
  racha_actual_sem: number;
  constancia_pct: string;   // decimal 2 dec
  saldo_actual: string;     // decimal 2 dec
};

export type RitmoPagoDTO = {
  ancla_dia_ruta: string;
  semanas: SemanaRitmoDTO[];
  eventos: EventoRitmoDTO[];
  resumen: ResumenRitmoDTO;
};
