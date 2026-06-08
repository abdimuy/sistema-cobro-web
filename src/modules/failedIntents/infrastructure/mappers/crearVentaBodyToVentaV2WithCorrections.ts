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

// crearVentaBodyToVentaV2WithCorrections is the audit-trail variant of
// crearVentaBodyToVentaV2: it returns the synthetic VentaV2 PLUS a
// list of every sanitization the mapper applied. Each correction
// captures (path, before, after, reason) so the operator can see
// exactly what was rewritten before they submit — no silent magic.
//
// `path` uses dot+index notation matching the wire JSON shape
// ("cliente.telefono", "productos[0].cantidad"). `reason` is a short
// human-readable Spanish phrase suitable for surfacing in the UI.

export type Correction = {
  readonly path: string;
  readonly before: unknown;
  readonly after: unknown;
  readonly reason: string;
};

export type CorrectionCollector = {
  add(c: Correction): void;
  list(): ReadonlyArray<Correction>;
};

function makeCollector(): CorrectionCollector {
  const items: Correction[] = [];
  return {
    add(c) {
      items.push(c);
    },
    list() {
      return items;
    },
  };
}

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

// ─── primitives ─────────────────────────────────────────────────────────────

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

// ─── sanitizers with audit trail ────────────────────────────────────────────
//
// Each sanitizer takes the raw value, the path it lives at, and the
// collector — if it has to substitute the value, it records a
// Correction. The sanitizer returns the sanitized value either way.

function sanMontoStr(v: unknown, path: string, c: CorrectionCollector): string {
  if (typeof v !== "string" && typeof v !== "number") {
    c.add({
      path,
      before: v,
      after: "0.00",
      reason: "el monto no era ni string ni número",
    });
    return "0.00";
  }
  const result = Monto.create(v as string | number);
  if (result instanceof Monto) {
    // Monto.create normalizes the string (e.g. "1000" → "1000.00").
    // Treat that as a real correction only when the input string
    // would have round-tripped to something different — otherwise the
    // audit trail floods with cosmetic " '1000' → '1000.00' " noise.
    const normalized = result.toV2String();
    if (typeof v === "string" && v !== normalized && v.trim() !== normalized) {
      // Normalize-only diff is not a semantic correction. Skip.
    }
    return normalized;
  }
  c.add({
    path,
    before: v,
    after: "0.00",
    reason: result.message,
  });
  return "0.00";
}

function sanCantidadStr(v: unknown, path: string, c: CorrectionCollector): string {
  if (typeof v !== "string" && typeof v !== "number") {
    c.add({
      path,
      before: v,
      after: "1",
      reason: "la cantidad no era ni string ni número",
    });
    return "1";
  }
  const result = Cantidad.create(v as string | number);
  if (result instanceof Cantidad) return result.toV2String();
  c.add({ path, before: v, after: "1", reason: result.message });
  return "1";
}

function sanTelefono(
  v: unknown,
  path: string,
  c: CorrectionCollector,
): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string") {
    c.add({
      path,
      before: v,
      after: null,
      reason: "el teléfono no era una cadena",
    });
    return null;
  }
  if (Telefono.create(v) instanceof Telefono) return v;
  c.add({
    path,
    before: v,
    after: null,
    reason: "el teléfono no cumple el formato E.164 ni 10 dígitos",
  });
  return null;
}

function sanNombre(v: unknown, path: string, c: CorrectionCollector): string {
  const raw = typeof v === "string" ? v : "";
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    c.add({
      path,
      before: v,
      after: "SIN NOMBRE",
      reason: "el nombre del cliente es obligatorio",
    });
    return "SIN NOMBRE";
  }
  if (trimmed.length > 200) {
    const clipped = trimmed.slice(0, 200);
    c.add({
      path,
      before: v,
      after: clipped,
      reason: "el nombre del cliente excedía 200 caracteres",
    });
    return clipped;
  }
  return raw;
}

function sanCalle(v: unknown, path: string, c: CorrectionCollector): string {
  const raw = typeof v === "string" ? v : "";
  if (raw.trim().length === 0) {
    c.add({
      path,
      before: v,
      after: "PENDIENTE",
      reason: "la calle de la dirección es obligatoria",
    });
    return "PENDIENTE";
  }
  return raw;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function sanLat(v: unknown, path: string, c: CorrectionCollector): number {
  if (typeof v !== "number" || !isFinite(v)) {
    c.add({ path, before: v, after: 0, reason: "latitud no era un número finito" });
    return 0;
  }
  if (v < -90 || v > 90) {
    const after = clamp(v, -90, 90);
    c.add({
      path,
      before: v,
      after,
      reason: "latitud fuera del rango [-90, 90]",
    });
    return after;
  }
  return v;
}

function sanLng(v: unknown, path: string, c: CorrectionCollector): number {
  if (typeof v !== "number" || !isFinite(v)) {
    c.add({ path, before: v, after: 0, reason: "longitud no era un número finito" });
    return 0;
  }
  if (v < -180 || v > 180) {
    const after = clamp(v, -180, 180);
    c.add({
      path,
      before: v,
      after,
      reason: "longitud fuera del rango [-180, 180]",
    });
    return after;
  }
  return v;
}

function sanAlmacenes(
  origenRaw: unknown,
  destinoRaw: unknown,
  pathPrefix: string,
  c: CorrectionCollector,
): { origen: number; destino: number } {
  let origen =
    typeof origenRaw === "number" && Number.isInteger(origenRaw) && origenRaw > 0
      ? origenRaw
      : 1;
  if (origen !== origenRaw) {
    c.add({
      path: `${pathPrefix}.almacen_origen_id`,
      before: origenRaw,
      after: origen,
      reason: "el id de almacén debe ser un entero positivo",
    });
  }
  let destino =
    typeof destinoRaw === "number" && Number.isInteger(destinoRaw) && destinoRaw > 0
      ? destinoRaw
      : 2;
  if (destino !== destinoRaw) {
    c.add({
      path: `${pathPrefix}.almacen_destino_id`,
      before: destinoRaw,
      after: destino,
      reason: "el id de almacén debe ser un entero positivo",
    });
  }
  if (origen === destino) {
    const fixed = origen === 2 ? 1 : 2;
    c.add({
      path: `${pathPrefix}.almacen_destino_id`,
      before: destino,
      after: fixed,
      reason: "el almacén de origen y destino no pueden ser iguales",
    });
    destino = fixed;
  }
  return { origen, destino };
}

// ─── mappers ────────────────────────────────────────────────────────────────

function mapCliente(raw: unknown, c: CorrectionCollector): ClienteSnapshotV2 {
  const r = asRecord(raw);
  return {
    cliente_id: asNumberOrNull(r.cliente_id),
    nombre: sanNombre(r.nombre, "cliente.nombre", c),
    telefono: sanTelefono(r.telefono, "cliente.telefono", c),
    aval: asStringOrNull(r.aval),
    referencia: asStringOrNull(r.referencia),
  };
}

function mapDireccion(raw: unknown, c: CorrectionCollector): DireccionV2 {
  const r = asRecord(raw);
  return {
    calle: sanCalle(r.calle, "direccion.calle", c),
    numero_exterior: asStringOrNull(r.numero_exterior),
    colonia: asString(r.colonia),
    poblacion: asString(r.poblacion),
    ciudad: asString(r.ciudad),
    zona_cliente_id: asNumberOrNull(r.zona_cliente_id),
  };
}

function mapGPS(raw: unknown, c: CorrectionCollector): GPSV2 {
  const r = asRecord(raw);
  return {
    latitud: sanLat(r.latitud, "gps.latitud", c),
    longitud: sanLng(r.longitud, "gps.longitud", c),
  };
}

function mapMontos(raw: unknown, c: CorrectionCollector): MontosV2 {
  const r = asRecord(raw);
  return {
    anual: sanMontoStr(r.anual, "montos.anual", c),
    corto_plazo: sanMontoStr(r.corto_plazo, "montos.corto_plazo", c),
    contado: sanMontoStr(r.contado, "montos.contado", c),
  };
}

function mapPlanCredito(raw: unknown, c: CorrectionCollector): PlanCreditoV2 | null {
  if (raw === null || raw === undefined) return null;
  const r = asRecord(raw);
  const plazoRaw = r.plazo_meses;
  let plazo: number;
  if (typeof plazoRaw === "number" && Number.isInteger(plazoRaw) && plazoRaw >= 1) {
    plazo = plazoRaw;
  } else {
    plazo = 1;
    c.add({
      path: "plan_credito.plazo_meses",
      before: plazoRaw,
      after: 1,
      reason: "el plazo en meses debe ser un entero mayor o igual a 1",
    });
  }
  const frecRaw = asString(r.frec_pago);
  let frec: string;
  if (VALID_FREC_PAGO.has(frecRaw)) {
    frec = frecRaw;
  } else {
    frec = "MENSUAL";
    c.add({
      path: "plan_credito.frec_pago",
      before: r.frec_pago,
      after: "MENSUAL",
      reason: "la frecuencia debe ser SEMANAL, QUINCENAL o MENSUAL",
    });
  }
  return {
    plazo_meses: plazo,
    enganche: sanMontoStr(r.enganche, "plan_credito.enganche", c),
    parcialidad: sanMontoStr(r.parcialidad, "plan_credito.parcialidad", c),
    frec_pago: frec,
  };
}

function mapDiaCobranza(
  raw: unknown,
  c: CorrectionCollector,
): DiaCobranzaV2 | null {
  if (raw === null || raw === undefined) return null;
  const r = asRecord(raw);
  const semanaRaw = asStringOrNull(r.semana);
  let semana: string | null = null;
  if (semanaRaw !== null) {
    if (VALID_DIAS_SEMANA.has(semanaRaw)) {
      semana = semanaRaw;
    } else {
      c.add({
        path: "dia_cobranza.semana",
        before: semanaRaw,
        after: null,
        reason: "el día de la semana no es válido",
      });
    }
  }
  const mesRaw = asNumberOrNull(r.mes);
  let mes: number | null = null;
  if (mesRaw !== null) {
    if (Number.isInteger(mesRaw) && mesRaw >= 1 && mesRaw <= 31) {
      mes = mesRaw;
    } else {
      c.add({
        path: "dia_cobranza.mes",
        before: mesRaw,
        after: null,
        reason: "el día del mes debe ser un entero entre 1 y 31",
      });
    }
  }
  if (semana === null && mes === null) return null;
  return { semana, mes };
}

function mapProducto(
  raw: unknown,
  index: number,
  c: CorrectionCollector,
): ProductoV2 {
  const r = asRecord(raw);
  const prefix = `productos[${index}]`;
  const comboID = asStringOrNull(r.combo_id);
  let origen: number | null = null;
  let destino: number | null = null;
  if (comboID === null) {
    const sane = sanAlmacenes(r.almacen_origen_id, r.almacen_destino_id, prefix, c);
    origen = sane.origen;
    destino = sane.destino;
  }
  return {
    id: asString(r.id),
    articulo_id: typeof r.articulo_id === "number" ? r.articulo_id : 0,
    articulo: asString(r.articulo),
    cantidad: sanCantidadStr(r.cantidad, `${prefix}.cantidad`, c),
    precio_anual: sanMontoStr(r.precio_anual, `${prefix}.precio_anual`, c),
    precio_corto: sanMontoStr(r.precio_corto, `${prefix}.precio_corto`, c),
    precio_contado: sanMontoStr(r.precio_contado, `${prefix}.precio_contado`, c),
    combo_id: comboID,
    almacen_origen_id: origen,
    almacen_destino_id: destino,
  };
}

function mapCombo(raw: unknown, index: number, c: CorrectionCollector): ComboV2 {
  const r = asRecord(raw);
  const prefix = `combos[${index}]`;
  const sane = sanAlmacenes(r.almacen_origen_id, r.almacen_destino_id, prefix, c);
  return {
    id: asString(r.id),
    nombre: asString(r.nombre),
    precio_anual: sanMontoStr(r.precio_anual, `${prefix}.precio_anual`, c),
    precio_corto: sanMontoStr(r.precio_corto, `${prefix}.precio_corto`, c),
    precio_contado: sanMontoStr(r.precio_contado, `${prefix}.precio_contado`, c),
    cantidad: sanCantidadStr(r.cantidad, `${prefix}.cantidad`, c),
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

export function crearVentaBodyToVentaV2WithCorrections(body: unknown): {
  venta: VentaV2 | null;
  corrections: ReadonlyArray<Correction>;
} {
  if (!isVentaShapedBody(body)) return { venta: null, corrections: [] };
  const b = asRecord(body);
  const c = makeCollector();

  const combosRaw = Array.isArray(b.combos) ? b.combos : [];
  const productosRaw = Array.isArray(b.productos) ? b.productos : [];
  const vendedoresRaw = Array.isArray(b.vendedores) ? b.vendedores : [];

  const venta: VentaV2 = {
    id: asString(b.id),
    cliente: mapCliente(b.cliente, c),
    direccion: mapDireccion(b.direccion, c),
    gps: mapGPS(b.gps, c),
    fecha_venta: asString(b.fecha_venta),
    tipo_venta: b.tipo_venta === "CREDITO" ? "CREDITO" : "CONTADO",
    estado: "active",
    situacion: "borrador",
    sincronizacion: "pendiente",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: mapMontos(b.montos, c),
    plan_credito: mapPlanCredito(b.plan_credito, c),
    dia_cobranza: mapDiaCobranza(b.dia_cobranza, c),
    nota: asStringOrNull(b.nota),
    combos: combosRaw.map((v, i) => mapCombo(v, i, c)),
    productos: productosRaw.map((v, i) => mapProducto(v, i, c)),
    vendedores: vendedoresRaw.map(mapVendedor),
    imagenes: [],
    cancelacion: null,
    aprobacion: null,
    created_at: SENTINEL_TIMESTAMP,
    updated_at: SENTINEL_TIMESTAMP,
    created_by: SENTINEL_USER_ID,
    updated_by: SENTINEL_USER_ID,
  };

  return { venta, corrections: c.list() };
}
