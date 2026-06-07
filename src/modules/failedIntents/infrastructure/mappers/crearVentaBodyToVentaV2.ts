import type {
  VentaV2,
  ClienteSnapshotV2,
  DireccionV2,
  GPSV2,
  MontosV2,
  PlanCreditoV2,
  DiaCobranzaV2,
  ProductoV2,
  ComboV2,
  VendedorV2,
} from "@/services/api/ventaV2Types";
import { isVentaShapedBody } from "./isVentaShapedBody";

// crearVentaBodyToVentaV2 projects a POST /v2/ventas request body into
// a synthetic VentaV2 so the ventasLocales editor tabs can drive it
// via useVentaEditState. CrearVentaBody is a subset of VentaV2:
// fields that only exist on the response (sincronizacion, microsip
// metadata, audit columns, imagenes) get sentinel defaults — they
// NEVER round-trip back to the wire because formDataToCrearVentaBody
// emits a CrearVentaBody shape, not a VentaV2.
//
// Returns null when the body fails the structural type guard. Returns
// non-null with no further validation — bad decimal strings, GPS
// out-of-range, etc. flow through to useVentaEditState which surfaces
// them as per-field errors on the form.

const SENTINEL_TIMESTAMP = new Date(0).toISOString();
const SENTINEL_USER_ID = "00000000-0000-0000-0000-000000000000";

function asRecord(v: unknown): Record<string, unknown> {
  return v as Record<string, unknown>;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumberOrNull(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

function asStringOrNull(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function mapCliente(raw: unknown): ClienteSnapshotV2 {
  const r = asRecord(raw);
  return {
    cliente_id: asNumberOrNull(r.cliente_id),
    nombre: asString(r.nombre),
    telefono: asStringOrNull(r.telefono),
    aval: asStringOrNull(r.aval),
    referencia: asStringOrNull(r.referencia),
  };
}

function mapDireccion(raw: unknown): DireccionV2 {
  const r = asRecord(raw);
  return {
    calle: asString(r.calle),
    numero_exterior: asStringOrNull(r.numero_exterior),
    colonia: asString(r.colonia),
    poblacion: asString(r.poblacion),
    ciudad: asString(r.ciudad),
    zona_cliente_id: asNumberOrNull(r.zona_cliente_id),
  };
}

function mapGPS(raw: unknown): GPSV2 {
  const r = asRecord(raw);
  return {
    latitud: typeof r.latitud === "number" ? r.latitud : 0,
    longitud: typeof r.longitud === "number" ? r.longitud : 0,
  };
}

function mapMontos(raw: unknown): MontosV2 {
  const r = asRecord(raw);
  return {
    anual: asString(r.anual, "0.00"),
    corto_plazo: asString(r.corto_plazo, "0.00"),
    contado: asString(r.contado, "0.00"),
  };
}

function mapPlanCredito(raw: unknown): PlanCreditoV2 | null {
  if (raw === null || raw === undefined) return null;
  const r = asRecord(raw);
  return {
    plazo_meses: typeof r.plazo_meses === "number" ? r.plazo_meses : 0,
    enganche: asString(r.enganche, "0.00"),
    parcialidad: asString(r.parcialidad, "0.00"),
    frec_pago: asString(r.frec_pago),
  };
}

function mapDiaCobranza(raw: unknown): DiaCobranzaV2 | null {
  if (raw === null || raw === undefined) return null;
  const r = asRecord(raw);
  return {
    semana: asStringOrNull(r.semana),
    mes: asNumberOrNull(r.mes),
  };
}

function mapProducto(raw: unknown): ProductoV2 {
  const r = asRecord(raw);
  return {
    id: asString(r.id),
    articulo_id: typeof r.articulo_id === "number" ? r.articulo_id : 0,
    articulo: asString(r.articulo),
    cantidad: asString(r.cantidad, "0"),
    precio_anual: asString(r.precio_anual, "0.00"),
    precio_corto: asString(r.precio_corto, "0.00"),
    precio_contado: asString(r.precio_contado, "0.00"),
    combo_id: asStringOrNull(r.combo_id),
    almacen_origen_id: asNumberOrNull(r.almacen_origen_id),
    almacen_destino_id: asNumberOrNull(r.almacen_destino_id),
  };
}

function mapCombo(raw: unknown): ComboV2 {
  const r = asRecord(raw);
  return {
    id: asString(r.id),
    nombre: asString(r.nombre),
    precio_anual: asString(r.precio_anual, "0.00"),
    precio_corto: asString(r.precio_corto, "0.00"),
    precio_contado: asString(r.precio_contado, "0.00"),
    cantidad: asString(r.cantidad, "0"),
    almacen_origen_id: typeof r.almacen_origen_id === "number" ? r.almacen_origen_id : 0,
    almacen_destino_id: typeof r.almacen_destino_id === "number" ? r.almacen_destino_id : 0,
  };
}

function mapVendedor(raw: unknown): VendedorV2 {
  const r = asRecord(raw);
  return {
    id: asString(r.id),
    usuario_id: asString(r.usuario_id),
    email: asString(r.email),
    nombre: asString(r.nombre),
  };
}

export function crearVentaBodyToVentaV2(body: unknown): VentaV2 | null {
  if (!isVentaShapedBody(body)) return null;
  const b = asRecord(body);

  const combosRaw = Array.isArray(b.combos) ? b.combos : [];
  const productosRaw = Array.isArray(b.productos) ? b.productos : [];
  const vendedoresRaw = Array.isArray(b.vendedores) ? b.vendedores : [];

  return {
    id: asString(b.id),
    cliente: mapCliente(b.cliente),
    direccion: mapDireccion(b.direccion),
    gps: mapGPS(b.gps),
    fecha_venta: asString(b.fecha_venta),
    tipo_venta: b.tipo_venta === "CREDITO" ? "CREDITO" : "CONTADO",
    estado: "active",
    situacion: "borrador",
    sincronizacion: "pendiente",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: mapMontos(b.montos),
    plan_credito: mapPlanCredito(b.plan_credito),
    dia_cobranza: mapDiaCobranza(b.dia_cobranza),
    nota: asStringOrNull(b.nota),
    combos: combosRaw.map(mapCombo),
    productos: productosRaw.map(mapProducto),
    vendedores: vendedoresRaw.map(mapVendedor),
    imagenes: [],
    cancelacion: null,
    aprobacion: null,
    created_at: SENTINEL_TIMESTAMP,
    updated_at: SENTINEL_TIMESTAMP,
    created_by: SENTINEL_USER_ID,
    updated_by: SENTINEL_USER_ID,
  };
}
