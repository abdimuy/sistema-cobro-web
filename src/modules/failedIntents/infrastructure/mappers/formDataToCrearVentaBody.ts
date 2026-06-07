import type { EditarVentaFormData } from "@/modules/ventasLocales/presentation/hooks/useVentaEditState";
import { Monto } from "@/modules/ventasLocales/domain/values/Monto";
import { Cantidad } from "@/modules/ventasLocales/domain/values/Cantidad";

// formDataToCrearVentaBody serializes the live EditarVentaFormData back
// into the POST /v2/ventas request shape. The original body is passed
// in to preserve fields the form does NOT surface — most importantly
// the venta id, which is read from originalBody.id (never from
// form.ventaID) so a mid-flight edit can't corrupt the identity of the
// venta being replayed.
//
// imagenes are intentionally dropped: in the multipart context they
// live as file parts, and in the JSON context POST /v2/ventas does not
// accept them at all.

type CrearVentaBodyShape = {
  id: string;
  cliente: {
    cliente_id: number | null;
    nombre: string;
    telefono: string | null;
    aval: string | null;
    referencia: string | null;
  };
  direccion: {
    calle: string;
    numero_exterior: string | null;
    colonia: string;
    poblacion: string;
    ciudad: string;
    zona_cliente_id: number | null;
  };
  gps: { latitud: number; longitud: number };
  fecha_venta: string;
  tipo_venta: "CONTADO" | "CREDITO";
  montos: { anual: string; corto_plazo: string; contado: string };
  plan_credito: {
    plazo_meses: number;
    enganche: string;
    parcialidad: string;
    frec_pago: string;
  } | null;
  dia_cobranza: { semana: string | null; mes: number | null } | null;
  nota: string | null;
  combos: Array<{
    id: string;
    nombre: string;
    precio_anual: string;
    precio_corto: string;
    precio_contado: string;
    cantidad: string;
    almacen_origen_id: number;
    almacen_destino_id: number;
  }>;
  productos: Array<{
    id: string;
    articulo_id: number;
    articulo: string;
    cantidad: string;
    precio_anual: string;
    precio_corto: string;
    precio_contado: string;
    combo_id: string | null;
    almacen_origen_id: number | null;
    almacen_destino_id: number | null;
  }>;
  vendedores: Array<{
    id: string;
    usuario_id: string;
    email: string;
    nombre: string;
  }>;
};

// asMontoStr uses Monto.create when the input is finite; otherwise it
// passes the form string through verbatim so the operator's broken
// edit shows up in the body as written (the form's own validation
// surfaces the error already; the mapper must not silently rewrite).
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

function readOriginalId(originalBody: unknown, fallback: string): string {
  if (typeof originalBody === "object" && originalBody !== null) {
    const id = (originalBody as { id?: unknown }).id;
    if (typeof id === "string" && id !== "") return id;
  }
  return fallback;
}

export function formDataToCrearVentaBody(
  form: EditarVentaFormData,
  originalBody: unknown,
): CrearVentaBodyShape {
  const activeProductos = form.productos.filter((p) => !p.isDeleted);
  const activeVendedores = form.vendedores.filter((v) => !v.isDeleted);
  const activeCombos = form.combos.filter((c) => !c.isDeleted);

  let planCredito: CrearVentaBodyShape["plan_credito"] = null;
  if (form.financiero.plazoMeses > 0) {
    planCredito = {
      plazo_meses: form.financiero.plazoMeses,
      enganche: asMontoStr(form.financiero.enganche),
      parcialidad: asMontoStr(form.financiero.parcialidad),
      frec_pago: form.financiero.frecPago,
    };
  }

  let diaCobranza: CrearVentaBodyShape["dia_cobranza"] = null;
  if (form.financiero.diaCobranzaSemana !== "") {
    diaCobranza = { semana: form.financiero.diaCobranzaSemana, mes: null };
  } else if (form.financiero.diaCobranzaMes > 0) {
    diaCobranza = { semana: null, mes: form.financiero.diaCobranzaMes };
  }

  return {
    id: readOriginalId(originalBody, form.ventaID),
    cliente: {
      cliente_id: form.cliente.clienteID,
      nombre: form.cliente.nombreCliente,
      telefono: emptyToNull(form.cliente.telefono),
      aval: emptyToNull(form.cliente.aval),
      referencia: emptyToNull(form.cliente.referencia),
    },
    direccion: {
      calle: form.cliente.calle,
      numero_exterior: emptyToNull(form.cliente.numeroExterior),
      colonia: form.cliente.colonia,
      poblacion: form.cliente.poblacion,
      ciudad: form.cliente.ciudad,
      zona_cliente_id: form.cliente.zonaClienteId,
    },
    gps: { latitud: form.gps.latitud, longitud: form.gps.longitud },
    fecha_venta: form.financiero.fechaVenta,
    tipo_venta: form.financiero.tipoVenta,
    montos: {
      anual: asMontoStr(form.financiero.montoAnual),
      corto_plazo: asMontoStr(form.financiero.montoCortoPlazo),
      contado: asMontoStr(form.financiero.montoContado),
    },
    plan_credito: planCredito,
    dia_cobranza: diaCobranza,
    nota: emptyToNull(form.financiero.nota),
    combos: activeCombos.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      precio_anual: asMontoStr(c.precioAnual),
      precio_corto: asMontoStr(c.precioCortoPlazo),
      precio_contado: asMontoStr(c.precioContado),
      cantidad: asCantidadStr(c.cantidad),
      almacen_origen_id: c.almacenOrigenID,
      almacen_destino_id: c.almacenDestinoID,
    })),
    productos: activeProductos.map((p) => ({
      id: p.id,
      articulo_id: p.articuloId,
      articulo: p.articulo,
      cantidad: asCantidadStr(p.cantidad),
      precio_anual: asMontoStr(p.precioAnual),
      precio_corto: asMontoStr(p.precioCortoPlazo),
      precio_contado: asMontoStr(p.precioContado),
      combo_id: p.comboID,
      almacen_origen_id: p.comboID !== null ? null : p.almacenOrigenID,
      almacen_destino_id: p.comboID !== null ? null : p.almacenDestinoID,
    })),
    vendedores: activeVendedores.map((v) => ({
      id: v.id,
      usuario_id: v.usuarioID,
      email: v.email,
      nombre: v.nombre,
    })),
  };
}
