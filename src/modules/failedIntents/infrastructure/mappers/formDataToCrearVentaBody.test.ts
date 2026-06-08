import { describe, expect, it } from "vitest";
import { crearVentaBodyToVentaV2 } from "./crearVentaBodyToVentaV2";
import { formDataToCrearVentaBody } from "./formDataToCrearVentaBody";
import type { EditarVentaFormData } from "@/modules/ventasLocales/presentation/hooks/useVentaEditState";

// Mini helper: bootstrap a form data object by re-using the same paths
// the hook uses internally — we project body→VentaV2 then mimic the
// proyectarVentaAFormData transformation inline so tests aren't coupled
// to ventasLocales internals. For round-trip tests we go through the
// real path: body → VentaV2 → bootstrap → form → body.

import { ventaV2ToDomain } from "@/modules/ventasLocales/infrastructure/mappers/ventaV2ToDomain";

function bodyToForm(body: Record<string, unknown>): EditarVentaFormData {
  const v = crearVentaBodyToVentaV2(body)!;
  const dom = ventaV2ToDomain(v);
  // Inline projection mirrors proyectarVentaAFormData (kept tiny — tests
  // don't need fancy almacenes detection).
  return {
    ventaID: dom.id,
    fechaVenta: dom.fechaVenta,
    cliente: {
      nombreCliente: dom.cliente.nombre.value,
      telefono: dom.cliente.telefono?.value ?? "",
      aval: dom.cliente.aval ?? "",
      referencia: dom.cliente.referencia ?? "",
      clienteID: dom.cliente.clienteID,
      calle: dom.direccion.calle,
      numeroExterior: dom.direccion.numeroExterior ?? "",
      colonia: dom.direccion.colonia,
      poblacion: dom.direccion.poblacion,
      ciudad: dom.direccion.ciudad,
      zonaClienteId: dom.direccion.zonaClienteID,
    },
    financiero: {
      tipoVenta: dom.tipoVenta,
      montoAnual: dom.montos.anual.toV2String(),
      montoCortoPlazo: dom.montos.cortoPlazo.toV2String(),
      montoContado: dom.montos.contado.toV2String(),
      plazoMeses: dom.planCredito?.plazoMeses ?? 0,
      enganche: dom.planCredito?.enganche.toV2String() ?? "0.00",
      parcialidad: dom.planCredito?.parcialidad.toV2String() ?? "0.00",
      frecPago: dom.planCredito?.frecPago ?? "",
      diaCobranzaSemana:
        dom.diaCobranza?.kind === "semana" ? dom.diaCobranza.dia : "",
      diaCobranzaMes: dom.diaCobranza?.kind === "mes" ? dom.diaCobranza.dia : 0,
      nota: dom.nota ?? "",
      fechaVenta: dom.fechaVenta,
    },
    productos: dom.productos.map((p) => ({
      id: p.id,
      articuloId: p.articuloID,
      articulo: p.articulo,
      cantidad: p.cantidad.toNumber(),
      precioAnual: p.precioAnual.toNumber(),
      precioCortoPlazo: p.precioCorto.toNumber(),
      precioContado: p.precioContado.toNumber(),
      comboID: p.comboID,
      almacenOrigenID: p.almacenes?.origenID ?? null,
      almacenDestinoID: p.almacenes?.destinoID ?? null,
      isNew: false,
      isDeleted: false,
    })),
    vendedores: dom.vendedores.map((vd) => ({
      id: vd.id,
      usuarioID: vd.usuarioID,
      email: vd.email,
      nombre: vd.nombre,
      isNew: false,
      isDeleted: false,
    })),
    combos: dom.combos.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      precioAnual: c.precioAnual.toNumber(),
      precioCortoPlazo: c.precioCorto.toNumber(),
      precioContado: c.precioContado.toNumber(),
      cantidad: c.cantidad.toNumber(),
      almacenOrigenID: c.almacenes.origenID,
      almacenDestinoID: c.almacenes.destinoID,
      isNew: false,
      isDeleted: false,
    })),
    imagenes: [],
    almacenes: { almacenOrigenID: 0, almacenDestinoID: 0 },
    gps: { latitud: dom.gps.latitud, longitud: dom.gps.longitud },
  };
}

function makeValidBody(): Record<string, unknown> {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: {
      cliente_id: 7,
      nombre: "CARLOS MENDEZ",
      telefono: "+524491234567",
      aval: "MARIA",
      referencia: "casa azul",
    },
    direccion: {
      calle: "AV AGUASCALIENTES",
      numero_exterior: "123",
      colonia: "CENTRO",
      poblacion: "AGUASCALIENTES",
      ciudad: "AGUASCALIENTES",
      zona_cliente_id: 4,
    },
    gps: { latitud: 21.88, longitud: -102.29 },
    fecha_venta: "2026-06-06T10:00:00Z",
    tipo_venta: "CREDITO",
    montos: { anual: "12000.00", corto_plazo: "10000.00", contado: "8000.00" },
    plan_credito: {
      plazo_meses: 12,
      enganche: "1000.00",
      parcialidad: "1000.00",
      frec_pago: "MENSUAL",
    },
    dia_cobranza: { semana: "VIERNES", mes: null },
    nota: "venta plan 12 meses",
    combos: [],
    productos: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        articulo_id: 100,
        articulo: "SILLA MARRON",
        cantidad: "2",
        precio_anual: "6000.00",
        precio_corto: "5000.00",
        precio_contado: "4000.00",
        combo_id: null,
        almacen_origen_id: 1,
        almacen_destino_id: 2,
      },
    ],
    vendedores: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        usuario_id: "44444444-4444-4444-4444-444444444444",
        email: "v@muebleriamsp.mx",
        nombre: "JUAN",
      },
    ],
  };
}

describe("formDataToCrearVentaBody", () => {
  it("round-trips a CREDITO body unchanged when form is untouched", () => {
    const original = makeValidBody();
    const form = bodyToForm(original);
    const roundtripped = formDataToCrearVentaBody(form, original);
    expect(roundtripped).toEqual(original);
  });

  it("preserves the original id even when ventaID was mutated", () => {
    const original = makeValidBody();
    const form = bodyToForm(original);
    form.ventaID = "99999999-9999-9999-9999-999999999999";
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    expect(body.id).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("applies edits to cliente.nombre", () => {
    const original = makeValidBody();
    const form = bodyToForm(original);
    form.cliente.nombreCliente = "MARIA LOPEZ";
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    const cliente = body.cliente as Record<string, unknown>;
    expect(cliente.nombre).toBe("MARIA LOPEZ");
  });

  it("omits productos flagged isDeleted", () => {
    const original = makeValidBody();
    const form = bodyToForm(original);
    form.productos[0].isDeleted = true;
    form.productos.push({
      id: "55555555-5555-5555-5555-555555555555",
      articuloId: 200,
      articulo: "MESA",
      cantidad: 1,
      precioAnual: 5000,
      precioCortoPlazo: 5000,
      precioContado: 5000,
      comboID: null,
      almacenOrigenID: 1,
      almacenDestinoID: 2,
      isNew: true,
      isDeleted: false,
    });
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    const productos = body.productos as Array<Record<string, unknown>>;
    expect(productos).toHaveLength(1);
    expect(productos[0].id).toBe("55555555-5555-5555-5555-555555555555");
    expect(productos[0].articulo).toBe("MESA");
  });

  it("emits decimal strings (not numbers) for cantidad / precios / montos", () => {
    const original = makeValidBody();
    const form = bodyToForm(original);
    form.financiero.montoAnual = "9999.99";
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    const montos = body.montos as Record<string, unknown>;
    expect(montos.anual).toBe("9999.99");
    expect(typeof montos.anual).toBe("string");
    const productos = body.productos as Array<Record<string, unknown>>;
    expect(typeof productos[0].cantidad).toBe("string");
    expect(typeof productos[0].precio_anual).toBe("string");
  });

  it("omits plan_credito when plazoMeses = 0 AND the original omitted it", () => {
    const original = makeValidBody();
    delete original.plan_credito;
    original.tipo_venta = "CONTADO";
    const form = bodyToForm(original);
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    expect("plan_credito" in body).toBe(false);
  });

  it("emits plan_credito = null when plazoMeses = 0 AND the original had plan_credito set", () => {
    // The original explicitly had a plan; the form is clearing it
    // (operator switched to CONTADO mid-edit). Surface as null — that's
    // an explicit removal, not a no-op.
    const original = makeValidBody();
    // plan_credito is already populated in makeValidBody
    const form = bodyToForm(original);
    form.financiero.plazoMeses = 0;
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    expect(body.plan_credito).toBeNull();
  });

  it("omits dia_cobranza when neither semana nor mes is set AND the original omitted it", () => {
    const original = makeValidBody();
    delete original.dia_cobranza;
    const form = bodyToForm(original);
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    expect("dia_cobranza" in body).toBe(false);
  });

  it("emits dia_cobranza = null when neither semana nor mes is set AND the original had it set", () => {
    const original = makeValidBody();
    // dia_cobranza is already populated in makeValidBody (semana: VIERNES)
    const form = bodyToForm(original);
    form.financiero.diaCobranzaSemana = "";
    form.financiero.diaCobranzaMes = 0;
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    expect(body.dia_cobranza).toBeNull();
  });

  it("emits dia_cobranza.mes shape when diaCobranzaMes > 0", () => {
    const original = makeValidBody();
    original.dia_cobranza = { mes: 15 };
    const form = bodyToForm(original);
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    expect(body.dia_cobranza).toEqual({ semana: null, mes: 15 });
  });

  it("emits a producto inside a combo preserving the original's almacenes shape", () => {
    // The original producto inside a combo had almacen_* omitted
    // entirely (it's nil in Go via omitempty). The source-faithful
    // reverse mapper preserves that — does NOT inject explicit null
    // keys the operator's wire never had.
    const original = makeValidBody();
    original.combos = [
      {
        id: "c1",
        nombre: "COMBO",
        precio_anual: "12000.00",
        precio_corto: "10000.00",
        precio_contado: "8000.00",
        cantidad: "1",
        almacen_origen_id: 1,
        almacen_destino_id: 2,
      },
    ];
    original.productos = [
      {
        id: "p1",
        articulo_id: 100,
        articulo: "CAMA",
        cantidad: "1",
        precio_anual: "0",
        precio_corto: "0",
        precio_contado: "0",
        combo_id: "c1",
        // no almacen_origen_id, no almacen_destino_id
      },
    ];
    const form = bodyToForm(original);
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    const productos = body.productos as Array<Record<string, unknown>>;
    expect(productos[0].combo_id).toBe("c1");
    expect("almacen_origen_id" in productos[0]).toBe(false);
    expect("almacen_destino_id" in productos[0]).toBe(false);
  });

  it("emits cliente.cliente_id = null when desvinculado", () => {
    const original = makeValidBody();
    const form = bodyToForm(original);
    form.cliente.clienteID = null;
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    const cliente = body.cliente as Record<string, unknown>;
    expect(cliente.cliente_id).toBeNull();
  });

  it("does NOT inject keys for optional fields that were omitted in the original body", () => {
    const minimal: Record<string, unknown> = {
      id: "11111111-1111-1111-1111-111111111111",
      cliente: {
        // no cliente_id, no telefono, no aval, no referencia
        nombre: "CARLOS MENDEZ",
      },
      direccion: {
        calle: "AV AGUASCALIENTES",
        // no numero_exterior, no zona_cliente_id
        colonia: "CENTRO",
        poblacion: "AGUASCALIENTES",
        ciudad: "AGUASCALIENTES",
      },
      gps: { latitud: 21.88, longitud: -102.29 },
      fecha_venta: "2026-06-06T10:00:00Z",
      tipo_venta: "CONTADO",
      montos: { anual: "1000.00", corto_plazo: "1000.00", contado: "1000.00" },
      // no plan_credito, no dia_cobranza, no nota
      combos: [],
      productos: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          articulo_id: 100,
          articulo: "SILLA",
          cantidad: "1",
          precio_anual: "1000.00",
          precio_corto: "1000.00",
          precio_contado: "1000.00",
          // no combo_id (omitted, not null)
          almacen_origen_id: 1,
          almacen_destino_id: 2,
        },
      ],
      vendedores: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          usuario_id: "44444444-4444-4444-4444-444444444444",
          email: "v@muebleriamsp.mx",
          nombre: "JUAN",
        },
      ],
    };
    const form = bodyToForm(minimal);
    const body = formDataToCrearVentaBody(form, minimal) as Record<string, unknown>;
    const cliente = body.cliente as Record<string, unknown>;
    const direccion = body.direccion as Record<string, unknown>;

    // Fields omitted in the original MUST stay omitted — not surfaced
    // as null — so the operator submitting unchanged sends the EXACT
    // same shape as what came in.
    expect("telefono" in cliente).toBe(false);
    expect("aval" in cliente).toBe(false);
    expect("referencia" in cliente).toBe(false);
    expect("cliente_id" in cliente).toBe(false);
    expect("numero_exterior" in direccion).toBe(false);
    expect("zona_cliente_id" in direccion).toBe(false);
    expect("plan_credito" in body).toBe(false);
    expect("dia_cobranza" in body).toBe(false);
    expect("nota" in body).toBe(false);

    const producto = (body.productos as Array<Record<string, unknown>>)[0];
    expect("combo_id" in producto).toBe(false);
  });

  it("preserves omitted-vs-null fidelity across a no-edit round-trip", () => {
    const minimal: Record<string, unknown> = {
      id: "11111111-1111-1111-1111-111111111111",
      cliente: { nombre: "CARLOS" },
      direccion: {
        calle: "AV X",
        colonia: "CENTRO",
        poblacion: "AGS",
        ciudad: "AGS",
      },
      gps: { latitud: 21.88, longitud: -102.29 },
      fecha_venta: "2026-06-06T10:00:00Z",
      tipo_venta: "CONTADO",
      montos: { anual: "1000.00", corto_plazo: "1000.00", contado: "1000.00" },
      combos: [],
      productos: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          articulo_id: 100,
          articulo: "SILLA",
          cantidad: "1",
          precio_anual: "1000.00",
          precio_corto: "1000.00",
          precio_contado: "1000.00",
          almacen_origen_id: 1,
          almacen_destino_id: 2,
        },
      ],
      vendedores: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          usuario_id: "44444444-4444-4444-4444-444444444444",
          email: "v@muebleriamsp.mx",
          nombre: "JUAN",
        },
      ],
    };
    const form = bodyToForm(minimal);
    const body = formDataToCrearVentaBody(form, minimal);
    // JSON-equality is the contract: same keys, same values, same shape.
    expect(JSON.stringify(body)).toBe(JSON.stringify(minimal));
  });

  it("emits telefono / aval / referencia / numero_exterior / nota as null when operator cleared a field that WAS present in the original", () => {
    // The original body had these fields populated; the operator
    // emptied them in the form. We surface that as an explicit null
    // (not a key omit), so the backend sees a real intent to clear.
    const original = makeValidBody();
    const form = bodyToForm(original);
    form.cliente.telefono = "";
    form.cliente.aval = "";
    form.cliente.referencia = "";
    form.cliente.numeroExterior = "";
    form.financiero.nota = "";
    const body = formDataToCrearVentaBody(form, original) as Record<string, unknown>;
    const cliente = body.cliente as Record<string, unknown>;
    const direccion = body.direccion as Record<string, unknown>;
    expect(cliente.telefono).toBeNull();
    expect(cliente.aval).toBeNull();
    expect(cliente.referencia).toBeNull();
    expect(direccion.numero_exterior).toBeNull();
    expect(body.nota).toBeNull();
  });
});
