import axios, { AxiosRequestConfig } from "axios";
import { URL_API } from "../../constants/api";

const BASE_URL = URL_API

// ─── V2 (Go API) ───────────────────────────────────────────────────────────

interface ClienteSnapshotV2 { cliente_id: number | null; nombre: string; telefono: string | null; aval: string | null; referencia: string | null }
interface DireccionV2 { calle: string; numero_exterior: string | null; colonia: string; poblacion: string; ciudad: string; zona_cliente_id: number | null }
interface GPSV2 { latitud: number; longitud: number }
interface MontosV2 { anual: string; corto_plazo: string; contado: string }
interface PlanCreditoV2 { plazo_meses: number; enganche: string; parcialidad: string; frec_pago: string }
interface DiaCobranzaV2 { semana: string | null; mes: number | null }
interface ProductoV2 { id: string; articulo_id: number; articulo: string; cantidad: string; precio_anual: string; precio_corto: string; precio_contado: string; combo_id: string | null; almacen_origen_id: number | null; almacen_destino_id: number | null }
interface ComboV2 { id: string; nombre: string; precio_anual: string; precio_corto: string; precio_contado: string; cantidad: string; almacen_origen_id: number; almacen_destino_id: number }
interface VendedorV2 { id: string; usuario_id: string; email: string; nombre: string }
interface ImagenV2 { id: string; storage_kind: string; storage_key: string; mime: string; size_bytes: number; descripcion: string | null; created_at: string; updated_at: string }

export interface VentaV2DTO {
  id: string;
  cliente: ClienteSnapshotV2;
  direccion: DireccionV2;
  gps: GPSV2;
  fecha_venta: string;
  tipo_venta: string;
  estado: string;
  situacion: string;
  sincronizacion: string;
  microsip_folio: string | null;
  microsip_docto_pv_id: number | null;
  microsip_aplicada_at: string | null;
  montos: MontosV2;
  plan_credito: PlanCreditoV2 | null;
  dia_cobranza: DiaCobranzaV2 | null;
  nota: string | null;
  combos: ComboV2[];
  productos: ProductoV2[];
  vendedores: VendedorV2[];
  imagenes: ImagenV2[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  aprobacion?: { at: string; by: string } | null;
  cancelacion?: { at: string; by: string; reason: string } | null;
}

export interface ListV2Response<T> { items: T[]; next_cursor?: string }

const numOrUndef = (s: string | null | undefined): number | undefined => {
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

export const adaptVentaV2ToLocal = (v: VentaV2DTO): VentaLocal => {
  const firstProd = v.productos[0];
  const dia = v.dia_cobranza?.semana ?? (v.dia_cobranza?.mes != null ? String(v.dia_cobranza.mes) : undefined);
  return {
    LOCAL_SALE_ID: v.id,
    USER_EMAIL: v.vendedores[0]?.email ?? "",
    ALMACEN_ID: firstProd?.almacen_origen_id ?? 0,
    ALMACEN_DESTINO_ID: firstProd?.almacen_destino_id ?? undefined,
    NOMBRE_CLIENTE: v.cliente.nombre,
    FECHA_VENTA: v.fecha_venta,
    LATITUD: v.gps.latitud,
    LONGITUD: v.gps.longitud,
    DIRECCION: v.direccion.calle,
    PRECIO_TOTAL: numOrUndef(v.montos.anual) ?? 0,
    TELEFONO: v.cliente.telefono ?? "",
    PARCIALIDAD: v.plan_credito ? numOrUndef(v.plan_credito.parcialidad) : undefined,
    ENGANCHE: v.plan_credito ? numOrUndef(v.plan_credito.enganche) : undefined,
    FREC_PAGO: v.plan_credito?.frec_pago,
    AVAL_O_RESPONSABLE: v.cliente.aval ?? undefined,
    NOTA: v.nota ?? undefined,
    DIA_COBRANZA: dia,
    TIEMPO_A_CORTO_PLAZOMESES: v.plan_credito?.plazo_meses,
    MONTO_A_CORTO_PLAZO: numOrUndef(v.montos.corto_plazo),
    NUMERO: v.direccion.numero_exterior ?? undefined,
    COLONIA: v.direccion.colonia,
    POBLACION: v.direccion.poblacion,
    CIUDAD: v.direccion.ciudad,
    TIPO_VENTA: v.tipo_venta,
    ZONA_CLIENTE_ID: v.direccion.zona_cliente_id ?? undefined,
    ZONA_CLIENTE: undefined,
    ENVIADO: true,
    SITUACION: v.situacion as VentaLocal["SITUACION"],
    SINCRONIZACION: v.sincronizacion as VentaLocal["SINCRONIZACION"],
    ESTADO: v.estado as VentaLocal["ESTADO"],
    MICROSIP_FOLIO: v.microsip_folio,
    MICROSIP_DOCTO_PV_ID: v.microsip_docto_pv_id,
    MICROSIP_APLICADA_AT: v.microsip_aplicada_at,
    MONTO_CONTADO: numOrUndef(v.montos.contado),
    PLAZO_MESES: v.plan_credito?.plazo_meses,
    CLIENTE_ID: v.cliente.cliente_id,
    REFERENCIA: v.cliente.referencia ?? undefined,
    CREATED_AT: v.created_at,
    UPDATED_AT: v.updated_at,
    CREATED_BY: v.created_by,
    UPDATED_BY: v.updated_by,
    APROBADO_AT: v.aprobacion?.at ?? null,
    APROBADO_BY: v.aprobacion?.by ?? null,
    CANCELADO_AT: v.cancelacion?.at ?? null,
    CANCELADO_BY: v.cancelacion?.by ?? null,
    CANCEL_REASON: v.cancelacion?.reason ?? null,
    PRODUCTOS_COUNT: v.productos.length,
    COMBOS_COUNT: v.combos.length,
    IMAGENES_COUNT: v.imagenes.length,
    vendedores: v.vendedores.map((ve) => ({
      LOCAL_SALE_ID: v.id,
      VENDEDOR_EMAIL: ve.email,
      NOMBRE_VENDEDOR: ve.nombre,
    })),
  };
};

export interface VendedorVenta {
  LOCAL_SALE_ID: string;
  VENDEDOR_EMAIL: string;
  NOMBRE_VENDEDOR: string;
}

export interface VentaLocal {
  LOCAL_SALE_ID: string;
  USER_EMAIL: string;
  ALMACEN_ID: number;
  ALMACEN_DESTINO_ID?: number;
  NOMBRE_CLIENTE: string;
  FECHA_VENTA: string;
  LATITUD: number;
  LONGITUD: number;
  DIRECCION: string;
  PRECIO_TOTAL: number;
  TELEFONO: string;
  PARCIALIDAD?: number;
  ENGANCHE?: number;
  FREC_PAGO?: string;
  AVAL_O_RESPONSABLE?: string;
  NOTA?: string;
  DIA_COBRANZA?: string;
  TIEMPO_A_CORTO_PLAZOMESES?: number;
  MONTO_A_CORTO_PLAZO?: number;
  NUMERO?: string;
  COLONIA?: string;
  POBLACION?: string;
  CIUDAD?: string;
  TIPO_VENTA?: string;
  ZONA_CLIENTE_ID?: number;
  ZONA_CLIENTE?: string;
  ENVIADO?: boolean;
  vendedores?: VendedorVenta[];
  SITUACION?: "borrador" | "revisada" | "aprobada" | "cancelada";
  SINCRONIZACION?: "pendiente" | "aplicada";
  ESTADO?: "active" | "deleted";
  MICROSIP_FOLIO?: string | null;
  MICROSIP_DOCTO_PV_ID?: number | null;
  MICROSIP_APLICADA_AT?: string | null;
  MONTO_CONTADO?: number;
  PLAZO_MESES?: number;
  CLIENTE_ID?: number | null;
  REFERENCIA?: string;
  CREATED_AT?: string;
  UPDATED_AT?: string;
  CREATED_BY?: string;
  UPDATED_BY?: string;
  APROBADO_AT?: string | null;
  APROBADO_BY?: string | null;
  CANCELADO_AT?: string | null;
  CANCELADO_BY?: string | null;
  CANCEL_REASON?: string | null;
  PRODUCTOS_COUNT?: number;
  COMBOS_COUNT?: number;
  IMAGENES_COUNT?: number;
}

// ============================================================================
// Types for V2 API (cursor pagination)
// ============================================================================

export interface VentasParams {
  // Date filters
  fechaInicio?: string;
  fechaFin?: string;
  // Text filters (partial match)
  nombreCliente?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  colonia?: string;
  poblacion?: string;
  // Exact filters
  zonaClienteId?: number;
  tipoVenta?: "CONTADO" | "CREDITO";
  situacion?: "borrador" | "revisada" | "aprobada" | "cancelada";
  sincronizacion?: "pendiente" | "aplicada";
  userEmail?: string;
  almacenId?: number;
  enviado?: boolean;
  vendedorEmails?: string;
  // Range filters
  precioMin?: number;
  precioMax?: number;
  // General search
  search?: string;
  // Pagination
  cursor?: string;
  limit?: number;
  // Sorting
  sortBy?: "fechaVenta" | "nombreCliente" | "precioTotal" | "ciudad" | "tipoVenta";
  sortOrder?: "asc" | "desc";
  // Options
  includeTotal?: boolean;
  incluirCanceladas?: boolean;
}

export interface VentasPagination {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor: string | null;
  previousCursor: string | null;
  limit: number;
  totalCount?: number;
}

export interface VentasFilters {
  applied: Record<string, unknown>;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface VentasResponse {
  error: boolean;
  status: number;
  body: {
    data: VentaLocal[];
    pagination: VentasPagination;
    filters: VentasFilters;
  };
}

export interface ProductoVenta {
  LOCAL_SALE_ID: string;
  ARTICULO_ID: number;
  ARTICULO: string;
  CANTIDAD: number;
  PRECIO_LISTA: number;
  PRECIO_CORTO_PLAZO: number;
  PRECIO_CONTADO: number;
  COMBO_ID: string | null;
}

export interface ComboVenta {
  COMBO_ID: string;
  LOCAL_SALE_ID: string;
  NOMBRE_COMBO: string;
  PRECIO_LISTA: number;
  PRECIO_CORTO_PLAZO: number;
  PRECIO_CONTADO: number;
}

export interface ImagenVenta {
  ID: string;
  LOCAL_SALE_ID: string;
  IMG_PATH: string;
  IMG_MIME: string;
  IMG_DESC: string;
  FECHA_SUBIDA: string;
}

export interface VentaCompleta extends VentaLocal {
  productos: ProductoVenta[];
  imagenes: ImagenVenta[];
  combos: ComboVenta[];
  vendedores: VendedorVenta[];
}

export interface ResumenVentas {
  TOTAL_VENTAS: number;
  MONTO_TOTAL: number;
  VENTAS_ENVIADAS: number;
  VENTAS_PENDIENTES: number;
}

// NOTE: the previous getVentasLocales() function lived here and hit
// GET /v2/ventas directly, but silently dropped most UI filters (search,
// zonaClienteId, precioMin/Max, sortBy, ...) because it only mapped 8 of the
// ~20 params the screen collects. It has been replaced by the hex search
// module in `src/modules/ventasLocales/{application,infrastructure,
// presentation}` — see HttpVentasListAdapter + useBuscarVentas, which map
// every backend-supported param and propagate the AbortSignal. VentasParams,
// VentaLocal, adaptVentaV2ToLocal, VentaV2DTO and ListV2Response stay here —
// they're still used by the new module and by the legacy functions below.

export const getVentaLocalCompleta = async (ventaId: string): Promise<VentaCompleta> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/ventas-locales/${ventaId}`,
    method: "GET",
  };
  const response = await axios.request<{ body: VentaCompleta; error: string }>(options);
  return response.data.body;
};

export const getImagenesVenta = async (ventaId: string): Promise<ImagenVenta[]> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/ventas-locales/${ventaId}/imagenes`,
    method: "GET",
  };
  const response = await axios.request<{ body: ImagenVenta[]; error: string }>(options);
  return response.data.body;
};

export const getResumenVentas = async (fechaInicio?: string, fechaFin?: string): Promise<ResumenVentas> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/ventas-locales/resumen`,
    method: "GET",
    params: { fechaInicio, fechaFin },
  };
  const response = await axios.request<{ body: ResumenVentas; error: string }>(options);
  return response.data.body;
};

export interface VendedorOption {
  VENDEDOR_EMAIL: string;
  NOMBRE_VENDEDOR: string;
}

export const getVendedores = async (): Promise<VendedorOption[]> => {
  // Fuente de vendedores: colección `users` de Firestore, vía la API legacy
  // (GET /notificaciones/usuarios-firebase → todos los usuarios). Antes pegaba
  // a /ventas-locales/vendedores, que solo traía DISTINCT de ventas pasadas
  // (MSP_LOCAL_SALE_VENDEDOR) → faltaban vendedores que aún no habían vendido.
  // TODO: migrar a la API Go cuando exponga el listado de vendedores.
  const response = await axios.get<{ email: string; nombre: string }[]>(
    `${BASE_URL}/notificaciones/usuarios-firebase`
  );
  return (response.data ?? [])
    .filter((u) => u.email)
    .map((u) => ({
      VENDEDOR_EMAIL: u.email,
      NOMBRE_VENDEDOR: u.nombre ?? u.email,
    }));
};

export const getImageUrl = (imagePath: string): string => {
  // Si la ruta ya incluye el dominio completo, la devolvemos tal como está
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Si no, construimos la URL completa con la base
  return `${BASE_URL}${imagePath}`;
};