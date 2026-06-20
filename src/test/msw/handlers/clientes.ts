import { http, HttpResponse } from "msw";
import type {
  ListResponseDTO,
  ClienteListItemDTO,
  FichaDTO,
  VentaListItemDTO,
  VentaDetalleDTO,
  RefrescarBusquedaResponseDTO,
} from "../../../modules/clientes/infrastructure/http/dtos";

// All clientes MSW handlers live here, keyed off the URL pattern the
// production adapter uses. Tests register them via
// `server.use(...clientesHandlers({...}))` and can override any single
// endpoint by calling `server.use(http.get(...))` afterwards.
export const CLIENTES_BASE = "*/v2/clientes";

type ErrorBody = Record<string, unknown>;

export type ClientesHandlerOptions = {
  list?: {
    response?: ListResponseDTO<ClienteListItemDTO>;
    assertParams?: (url: URL, headers: Headers) => void;
  };
  ficha?: {
    response?: FichaDTO;
    assertParams?: (url: URL, headers: Headers) => void;
  };
  ventas?: {
    response?: ListResponseDTO<VentaListItemDTO>;
    assertParams?: (url: URL, headers: Headers) => void;
  };
  ventaDetalle?: {
    response?: VentaDetalleDTO;
    assertParams?: (url: URL, headers: Headers) => void;
  };
  refresh?: {
    response?: RefrescarBusquedaResponseDTO;
    assertCall?: (body: unknown) => void;
    error?: { status: number; body: ErrorBody };
  };
};

const DEFAULT_LIST: ListResponseDTO<ClienteListItemDTO> = {
  items: [
    {
      cliente_id: 1042,
      nombre: "MUEBLES HERNÁNDEZ S.A.",
      zona: "ZONA_NORTE",
      telefono: "5512345678",
      direccion_corta: "Av. Insurgentes 45, Col. Centro",
      score: 68,
      segmento: "DORMIDO_VALIOSO",
      estado_pago: "AL_CORRIENTE",
      tiene_pulso: true,
      recencia_dias: 120,
      saldo: "8500.00",
      tier_riesgo: "AL_DIA",
      pct_pagos_a_tiempo: "92.00",
      fecha_prox_pago: "2026-07-01T00:00:00Z",
      banda_credito: "BAJO",
      score_credito: 82,
      banda_recompra: "ALTA",
      score_recompra: 76,
      clv: "9200.00",
      banda_clv: "ALTO",
    },
  ],
  next_cursor: "",
};

const DEFAULT_FICHA: FichaDTO = {
  cliente_id: 1042,
  nombre: "MUEBLES HERNÁNDEZ S.A.",
  direccion: {
    calle: "Av. Insurgentes 45",
    colonia: "Col. Centro",
    poblacion: "Ciudad de México",
    estado: "CDMX",
  },
  telefono: "5512345678",
  limite_credito: "50000.00",
  notas: "",
  zona: "ZONA_NORTE",
  cobrador: "José Guadalupe Pérez Morales",
  estatus: "ACTIVO",
  resumen: {
    total_comprado: "120000.00",
    total_abonado: "111500.00",
    saldo: "8500.00",
    pct_liquidado: "92.92",
    ticket_promedio: "17142.86",
    num_ventas: 7,
    num_pagos: 24,
  },
  series: {
    abonos_por_mes: [],
    comprado_vs_abonado: [],
  },
  pulso: {
    score: 68,
    segmento: "DORMIDO_VALIOSO",
    estado_pago: "AL_CORRIENTE",
    recencia_dias: 120,
    frecuencia: 7,
    monetary: "120000.00",
    saldo: "8500.00",
    por_liquidar_pct: "7.08",
    fecha_ultima_compra: "2025-11-01T00:00:00Z",
    fecha_ultimo_pago: "2025-12-15T00:00:00Z",
    next_best_product: "COMEDOR",
    num_pagos: 24,
    cadencia_dias: 30,
    dias_atraso_prom: 3,
    pct_pagos_a_tiempo: "87.50",
    fecha_prox_pago: "2026-01-15T12:00:00Z",
    monto_prox_pago: "3500.00",
    tier_riesgo: "VIGILANCIA",
    banda_credito: "MEDIO",
    score_credito: 55,
    credito_drivers: ["Algunos retrasos recientes"],
    banda_recompra: "ALTA",
    score_recompra: 76,
    recompra_drivers: ["Alta frecuencia de compra"],
    clv: "9200.00",
    banda_clv: "ALTO",
  },
  ubicacion: {
    lat: 19.4326,
    lng: -99.1332,
    disponible: true,
  },
};

const DEFAULT_VENTAS: ListResponseDTO<VentaListItemDTO> = {
  items: [
    {
      docto_pv_id: 30015,
      fecha: "2025-11-01T00:00:00Z",
      folio: "CV-00542",
      tipo: "CREDITO",
      total: "18500.00",
      saldo_venta: "3200.00",
      num_pagos: 5,
    },
  ],
  next_cursor: "",
};

const DEFAULT_VENTA_DETALLE: VentaDetalleDTO = {
  venta: {
    docto_pv_id: 30015,
    cliente_id: 1042,
    fecha: "2025-11-01T00:00:00Z",
    folio: "CV-00542",
    tipo: "CREDITO",
    total: "18500.00",
    saldo_venta: "3200.00",
    num_pagos: 5,
  },
  productos: [
    {
      articulo_id: 8801,
      nombre: "SALA IMPERIAL 3-2-1",
      unidades: "1.00000",
      precio_unitario: "18500.00",
      precio_total_neto: "18500.00",
      pctje_dscto: "0.00",
    },
  ],
  contrato: {
    parcialidad: "3200.00",
    enganche: "3700.00",
    precio_de_contado: "15000.00",
    plazo_meses: 6,
    forma_de_pago: "QUINCENAL",
    vendedores: ["María Concepción Ramírez Torres"],
  },
  pagos: [
    {
      docto_cc_id: 70234,
      fecha: "2025-12-15T00:00:00Z",
      importe: "3200.00",
      forma_cobro: "EFECTIVO",
      concepto_cc_id: 87327,
      concepto: "ABONO",
      categoria: "pago",
      cobrador: "José Guadalupe Pérez Morales",
      es_ingreso: true,
    },
  ],
};

export function clientesHandlers(opts: ClientesHandlerOptions = {}) {
  const o = opts;
  return [
    // GET /clientes — directory search with pagination
    http.get(CLIENTES_BASE, ({ request }) => {
      const url = new URL(request.url);
      o.list?.assertParams?.(url, request.headers);
      return HttpResponse.json(o.list?.response ?? DEFAULT_LIST);
    }),

    // GET /clientes/:id — ficha / full profile
    http.get(`${CLIENTES_BASE}/:clienteId`, ({ request, params }) => {
      // Exclude sub-resources (ventas) — those are handled by dedicated handlers.
      const url = new URL(request.url);
      if (url.pathname.includes("/ventas")) return;
      o.ficha?.assertParams?.(url, request.headers);
      void params; // clienteId available if needed for dynamic responses
      return HttpResponse.json(o.ficha?.response ?? DEFAULT_FICHA);
    }),

    // GET /clientes/:id/ventas — paginated venta list
    http.get(`${CLIENTES_BASE}/:clienteId/ventas`, ({ request }) => {
      const url = new URL(request.url);
      // Exclude venta detail endpoint
      if (url.pathname.match(/\/ventas\/\d+$/)) return;
      o.ventas?.assertParams?.(url, request.headers);
      return HttpResponse.json(o.ventas?.response ?? DEFAULT_VENTAS);
    }),

    // GET /clientes/:id/ventas/:doctoPvId — venta detail
    http.get(
      `${CLIENTES_BASE}/:clienteId/ventas/:doctoPvId`,
      ({ request }) => {
        const url = new URL(request.url);
        o.ventaDetalle?.assertParams?.(url, request.headers);
        return HttpResponse.json(
          o.ventaDetalle?.response ?? DEFAULT_VENTA_DETALLE,
        );
      },
    ),

    // POST /clientes/_search/refresh — admin reindex
    http.post(`${CLIENTES_BASE}/_search/refresh`, async ({ request }) => {
      const body = await request.json().catch(() => null);
      o.refresh?.assertCall?.(body);
      if (o.refresh?.error) {
        return HttpResponse.json(o.refresh.error.body, {
          status: o.refresh.error.status,
        });
      }
      return HttpResponse.json(
        o.refresh?.response ?? { reindexado: true, documentos: 157 },
      );
    }),
  ];
}
