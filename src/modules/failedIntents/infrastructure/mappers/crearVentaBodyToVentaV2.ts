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
import { Monto } from "@/modules/ventasLocales/domain/values/Monto";
import { Cantidad } from "@/modules/ventasLocales/domain/values/Cantidad";
import { Telefono } from "@/modules/ventasLocales/domain/values/Telefono";
import { isVentaShapedBody } from "./isVentaShapedBody";

// crearVentaBodyToVentaV2 projects a POST /v2/ventas request body into
// a synthetic VentaV2 so the ventasLocales editor tabs can drive it
// via useVentaEditState. CrearVentaBody is a subset of VentaV2:
// fields that only exist on the response (sincronizacion, microsip
// metadata, audit columns, imagenes) get sentinel defaults — they
// NEVER round-trip back to the wire because formDataToCrearVentaBody
// emits a CrearVentaBody shape, not a VentaV2.
//
// Returns null when the body fails the structural guard. Returns
// non-null otherwise. Values that would trip a domain VO when the
// hook later runs ventaV2ToDomain are SANITIZED to safe defaults
// here, so the form can always mount on a structurally-valid body —
// the operator then sees the (possibly corrected) values in the
// fields and the form's own per-field validation shows what's wrong.

const SENTINEL_TIMESTAMP = new Date(0).toISOString();
const SENTINEL_USER_ID = "00000000-0000-0000-0000-000000000000";

const VALID_DIAS_SEMANA: ReadonlySet<string> = new Set([
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
]);

const VALID_FREC_PAGO: ReadonlySet<string> = new Set([
  "SEMANAL",
  "QUINCENAL",
  "MENSUAL",
]);

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

// sanitizeMontoStr returns a decimal string Monto.create accepts; if
// the input fails validation we substitute "0.00" so ventaV2ToDomain
// doesn't throw. The original value is irretrievably lost — the
// operator will see "0.00" in the field and must re-enter a value.
function sanitizeMontoStr(v: unknown): string {
  if (typeof v !== "string" && typeof v !== "number") return "0.00";
  const result = Monto.create(v as string | number);
  return result instanceof Monto ? result.toV2String() : "0.00";
}

// sanitizeCantidadStr returns a value Cantidad.create accepts; broken
// inputs fall back to "1".
function sanitizeCantidadStr(v: unknown): string {
  if (typeof v !== "string" && typeof v !== "number") return "1";
  const result = Cantidad.create(v as string | number);
  return result instanceof Cantidad ? result.toV2String() : "1";
}

function sanitizeTelefono(v: unknown): string | null {
  if (typeof v !== "string" || v === "") return null;
  return Telefono.create(v) instanceof Telefono ? v : null;
}

function sanitizeNombre(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.length === 0) return "SIN NOMBRE";
  if (s.length > 200) return s.slice(0, 200);
  return s;
}

function sanitizeCalle(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length === 0 ? "PENDIENTE" : s;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function sanitizeLat(v: unknown): number {
  return typeof v === "number" && isFinite(v) ? clamp(v, -90, 90) : 0;
}

function sanitizeLng(v: unknown): number {
  return typeof v === "number" && isFinite(v) ? clamp(v, -180, 180) : 0;
}

function sanitizeAlmacenes(
  origen: unknown,
  destino: unknown,
): { origen: number; destino: number } {
  let o = typeof origen === "number" && Number.isInteger(origen) && origen > 0 ? origen : 1;
  let d =
    typeof destino === "number" && Number.isInteger(destino) && destino > 0
      ? destino
      : 2;
  if (o === d) d = o === 2 ? 1 : 2;
  return { origen: o, destino: d };
}

function mapCliente(raw: unknown): ClienteSnapshotV2 {
  const r = asRecord(raw);
  return {
    cliente_id: asNumberOrNull(r.cliente_id),
    nombre: sanitizeNombre(r.nombre),
    telefono: sanitizeTelefono(r.telefono),
    aval: asStringOrNull(r.aval),
    referencia: asStringOrNull(r.referencia),
  };
}

function mapDireccion(raw: unknown): DireccionV2 {
  const r = asRecord(raw);
  return {
    calle: sanitizeCalle(r.calle),
    numero_exterior: asStringOrNull(r.numero_exterior),
    colonia: asString(r.colonia),
    poblacion: asString(r.poblacion),
    ciudad: asString(r.ciudad),
    zona_cliente_id: asNumberOrNull(r.zona_cliente_id),
  };
}

function mapGPS(raw: unknown): GPSV2 {
  const r = asRecord(raw);
  return { latitud: sanitizeLat(r.latitud), longitud: sanitizeLng(r.longitud) };
}

function mapMontos(raw: unknown): MontosV2 {
  const r = asRecord(raw);
  return {
    anual: sanitizeMontoStr(r.anual),
    corto_plazo: sanitizeMontoStr(r.corto_plazo),
    contado: sanitizeMontoStr(r.contado),
  };
}

function mapPlanCredito(raw: unknown): PlanCreditoV2 | null {
  if (raw === null || raw === undefined) return null;
  const r = asRecord(raw);
  const plazoRaw = r.plazo_meses;
  const plazo =
    typeof plazoRaw === "number" && Number.isInteger(plazoRaw) && plazoRaw >= 1
      ? plazoRaw
      : 1;
  const frec = asString(r.frec_pago);
  return {
    plazo_meses: plazo,
    enganche: sanitizeMontoStr(r.enganche),
    parcialidad: sanitizeMontoStr(r.parcialidad),
    frec_pago: VALID_FREC_PAGO.has(frec) ? frec : "MENSUAL",
  };
}

function mapDiaCobranza(raw: unknown): DiaCobranzaV2 | null {
  if (raw === null || raw === undefined) return null;
  const r = asRecord(raw);
  const semanaRaw = asStringOrNull(r.semana);
  const semana =
    semanaRaw !== null && VALID_DIAS_SEMANA.has(semanaRaw) ? semanaRaw : null;
  const mesRaw = asNumberOrNull(r.mes);
  const mes =
    mesRaw !== null && Number.isInteger(mesRaw) && mesRaw >= 1 && mesRaw <= 31
      ? mesRaw
      : null;
  // Exactly one of semana / mes must be set for ventaV2ToDomain.
  // If both end up null after sanitization, drop the dia_cobranza.
  if (semana === null && mes === null) return null;
  return { semana, mes };
}

function mapProducto(raw: unknown): ProductoV2 {
  const r = asRecord(raw);
  const comboID = asStringOrNull(r.combo_id);

  // Domain invariant (Producto.create): exactly one of comboID or
  // almacenes must be set. When the producto is NOT in a combo, both
  // almacen_origen_id and almacen_destino_id must be present and pass
  // AlmacenesPair.create (positive ints, not equal).
  let origenID: number | null = null;
  let destinoID: number | null = null;
  if (comboID === null) {
    const sane = sanitizeAlmacenes(r.almacen_origen_id, r.almacen_destino_id);
    origenID = sane.origen;
    destinoID = sane.destino;
  }

  return {
    id: asString(r.id),
    articulo_id: typeof r.articulo_id === "number" ? r.articulo_id : 0,
    articulo: asString(r.articulo),
    cantidad: sanitizeCantidadStr(r.cantidad),
    precio_anual: sanitizeMontoStr(r.precio_anual),
    precio_corto: sanitizeMontoStr(r.precio_corto),
    precio_contado: sanitizeMontoStr(r.precio_contado),
    combo_id: comboID,
    almacen_origen_id: origenID,
    almacen_destino_id: destinoID,
  };
}

function mapCombo(raw: unknown): ComboV2 {
  const r = asRecord(raw);
  const sane = sanitizeAlmacenes(r.almacen_origen_id, r.almacen_destino_id);
  return {
    id: asString(r.id),
    nombre: asString(r.nombre),
    precio_anual: sanitizeMontoStr(r.precio_anual),
    precio_corto: sanitizeMontoStr(r.precio_corto),
    precio_contado: sanitizeMontoStr(r.precio_contado),
    cantidad: sanitizeCantidadStr(r.cantidad),
    almacen_origen_id: sane.origen,
    almacen_destino_id: sane.destino,
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
