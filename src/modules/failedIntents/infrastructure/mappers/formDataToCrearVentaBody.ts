import type { EditarVentaFormData } from "@/modules/ventasLocales/presentation/hooks/useVentaEditState";
import { Monto } from "@/modules/ventasLocales/domain/values/Monto";
import { Cantidad } from "@/modules/ventasLocales/domain/values/Cantidad";

// formDataToCrearVentaBody serializes the live EditarVentaFormData back
// into the POST /v2/ventas request shape. The reverse mapper is
// SOURCE-FAITHFUL: it starts from a JSON clone of `originalBody` and
// only applies the form's actual edits on top, so a no-edit submit
// produces the exact same shape as what came in — same keys, same
// order, same omitted-vs-null distinction. Without this, the operator
// would see fields appear (`telefono: null`, `nota: null`) that
// weren't in the original and have no audit-trail explanation.
//
// Rules for optional fields:
//   • form value populated   → emit it.
//   • form value empty, original HAD the key → emit null (operator
//     cleared a field that was set; explicit clear is meaningful).
//   • form value empty, original DID NOT have the key → omit the key.
//
// imagenes are dropped: in the multipart context they live as file
// parts; in the JSON context POST /v2/ventas does not accept them.

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function jsonClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function asMontoStr(input: string | number): string {
  const result = Monto.create(input);
  if (result instanceof Monto) return result.toV2String();
  return typeof input === "string" ? input : String(input);
}

function asCantidadStr(input: string | number): string {
  const result = Cantidad.create(input);
  if (result instanceof Cantidad) return result.toV2String();
  return typeof input === "string" ? input : String(input);
}

function emptyToNull(s: string): string | null {
  return s === "" ? null : s;
}

// setOptional: present → set the value, absent-and-original-had-the-key
// → set null, absent-and-omitted → delete.
function setOptional(
  target: Record<string, unknown>,
  key: string,
  value: unknown,
  original: unknown,
): void {
  const present = value !== null && value !== undefined && value !== "";
  const origHas = isRecord(original) && key in original;
  if (present) {
    target[key] = value;
  } else if (origHas) {
    target[key] = null;
  } else {
    delete target[key];
  }
}

function readOriginalId(originalBody: unknown, fallback: string): string {
  if (typeof originalBody === "object" && originalBody !== null) {
    const id = (originalBody as { id?: unknown }).id;
    if (typeof id === "string" && id !== "") return id;
  }
  return fallback;
}

// findOriginalProducto/combo: match by id (UUID), so reorders by the
// operator don't lose the source's per-field shape.
function findOriginalById(
  originals: ReadonlyArray<unknown>,
  id: string,
): Record<string, unknown> | null {
  for (const o of originals) {
    if (isRecord(o) && o.id === id) return o;
  }
  return null;
}

export function formDataToCrearVentaBody(
  form: EditarVentaFormData,
  originalBody: unknown,
): unknown {
  const original = isRecord(originalBody) ? originalBody : {};
  const out = isRecord(original) ? (jsonClone(original) as Record<string, unknown>) : {};

  // ── Always-present scalar fields ─────────────────────────────────────────
  out.id = readOriginalId(originalBody, form.ventaID);
  out.fecha_venta = form.financiero.fechaVenta;
  out.tipo_venta = form.financiero.tipoVenta;
  out.gps = { latitud: form.gps.latitud, longitud: form.gps.longitud };
  out.montos = {
    anual: asMontoStr(form.financiero.montoAnual),
    corto_plazo: asMontoStr(form.financiero.montoCortoPlazo),
    contado: asMontoStr(form.financiero.montoContado),
  };

  // ── cliente ─────────────────────────────────────────────────────────────
  const origCliente = isRecord(original.cliente) ? original.cliente : {};
  const outCliente = jsonClone(origCliente) as Record<string, unknown>;
  outCliente.nombre = form.cliente.nombreCliente;
  setOptional(outCliente, "cliente_id", form.cliente.clienteID, origCliente);
  setOptional(outCliente, "telefono", emptyToNull(form.cliente.telefono), origCliente);
  setOptional(outCliente, "aval", emptyToNull(form.cliente.aval), origCliente);
  setOptional(outCliente, "referencia", emptyToNull(form.cliente.referencia), origCliente);
  out.cliente = outCliente;

  // ── direccion ───────────────────────────────────────────────────────────
  const origDireccion = isRecord(original.direccion) ? original.direccion : {};
  const outDireccion = jsonClone(origDireccion) as Record<string, unknown>;
  outDireccion.calle = form.cliente.calle;
  outDireccion.colonia = form.cliente.colonia;
  outDireccion.poblacion = form.cliente.poblacion;
  outDireccion.ciudad = form.cliente.ciudad;
  setOptional(outDireccion, "numero_exterior", emptyToNull(form.cliente.numeroExterior), origDireccion);
  setOptional(outDireccion, "zona_cliente_id", form.cliente.zonaClienteId, origDireccion);
  out.direccion = outDireccion;

  // ── plan_credito ────────────────────────────────────────────────────────
  if (form.financiero.plazoMeses > 0) {
    out.plan_credito = {
      plazo_meses: form.financiero.plazoMeses,
      enganche: asMontoStr(form.financiero.enganche),
      parcialidad: asMontoStr(form.financiero.parcialidad),
      frec_pago: form.financiero.frecPago,
    };
  } else if ("plan_credito" in original) {
    out.plan_credito = null;
  } else {
    delete out.plan_credito;
  }

  // ── dia_cobranza ────────────────────────────────────────────────────────
  let diaCobranza: { semana: string | null; mes: number | null } | null = null;
  if (form.financiero.diaCobranzaSemana !== "") {
    diaCobranza = { semana: form.financiero.diaCobranzaSemana, mes: null };
  } else if (form.financiero.diaCobranzaMes > 0) {
    diaCobranza = { semana: null, mes: form.financiero.diaCobranzaMes };
  }
  if (diaCobranza !== null) {
    out.dia_cobranza = diaCobranza;
  } else if ("dia_cobranza" in original) {
    out.dia_cobranza = null;
  } else {
    delete out.dia_cobranza;
  }

  // ── nota ────────────────────────────────────────────────────────────────
  setOptional(out, "nota", emptyToNull(form.financiero.nota), original);

  // ── productos ───────────────────────────────────────────────────────────
  const origProductos = Array.isArray(original.productos) ? original.productos : [];
  const activeProductos = form.productos.filter((p) => !p.isDeleted);
  out.productos = activeProductos.map((p) => {
    const origP = findOriginalById(origProductos, p.id);
    const target: Record<string, unknown> = origP ? jsonClone(origP) : {};
    target.id = p.id;
    target.articulo_id = p.articuloId;
    target.articulo = p.articulo;
    target.cantidad = asCantidadStr(p.cantidad);
    target.precio_anual = asMontoStr(p.precioAnual);
    target.precio_corto = asMontoStr(p.precioCortoPlazo);
    target.precio_contado = asMontoStr(p.precioContado);
    setOptional(target, "combo_id", p.comboID, origP);
    if (p.comboID === null) {
      // Mandatory when not in a combo — emit even if origP omitted them
      // (mapper would have sanitized to defaults).
      target.almacen_origen_id = p.almacenOrigenID;
      target.almacen_destino_id = p.almacenDestinoID;
    } else {
      setOptional(target, "almacen_origen_id", null, origP);
      setOptional(target, "almacen_destino_id", null, origP);
    }
    return target;
  });

  // ── combos ──────────────────────────────────────────────────────────────
  const origCombos = Array.isArray(original.combos) ? original.combos : [];
  const activeCombos = form.combos.filter((c) => !c.isDeleted);
  out.combos = activeCombos.map((c) => {
    const origC = findOriginalById(origCombos, c.id);
    const target: Record<string, unknown> = origC ? jsonClone(origC) : {};
    target.id = c.id;
    target.nombre = c.nombre;
    target.precio_anual = asMontoStr(c.precioAnual);
    target.precio_corto = asMontoStr(c.precioCortoPlazo);
    target.precio_contado = asMontoStr(c.precioContado);
    target.cantidad = asCantidadStr(c.cantidad);
    target.almacen_origen_id = c.almacenOrigenID;
    target.almacen_destino_id = c.almacenDestinoID;
    return target;
  });

  // ── vendedores ──────────────────────────────────────────────────────────
  const origVendedores = Array.isArray(original.vendedores) ? original.vendedores : [];
  const activeVendedores = form.vendedores.filter((v) => !v.isDeleted);
  out.vendedores = activeVendedores.map((v) => {
    const origV = findOriginalById(origVendedores, v.id);
    const target: Record<string, unknown> = origV ? jsonClone(origV) : {};
    target.id = v.id;
    target.usuario_id = v.usuarioID;
    target.email = v.email;
    target.nombre = v.nombre;
    return target;
  });

  // imagenes never go in the JSON body; if the original had them
  // mirrored in (which shouldn't happen for a CrearVentaBody, but be
  // defensive), drop them.
  delete out.imagenes;

  return out;
}
