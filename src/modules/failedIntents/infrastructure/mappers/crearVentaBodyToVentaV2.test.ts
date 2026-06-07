import { describe, expect, it } from "vitest";
import { crearVentaBodyToVentaV2 } from "./crearVentaBodyToVentaV2";

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
    dia_cobranza: { semana: "VIERNES" },
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

describe("crearVentaBodyToVentaV2", () => {
  it("maps a complete CREDITO body into a VentaV2 with all snake_case fields", () => {
    const result = crearVentaBodyToVentaV2(makeValidBody());
    expect(result).not.toBeNull();
    const v = result!;
    expect(v.id).toBe("11111111-1111-1111-1111-111111111111");
    expect(v.cliente.nombre).toBe("CARLOS MENDEZ");
    expect(v.cliente.cliente_id).toBe(7);
    expect(v.cliente.telefono).toBe("+524491234567");
    expect(v.direccion.calle).toBe("AV AGUASCALIENTES");
    expect(v.direccion.numero_exterior).toBe("123");
    expect(v.direccion.zona_cliente_id).toBe(4);
    expect(v.gps).toEqual({ latitud: 21.88, longitud: -102.29 });
    expect(v.fecha_venta).toBe("2026-06-06T10:00:00Z");
    expect(v.tipo_venta).toBe("CREDITO");
    expect(v.montos).toEqual({ anual: "12000.00", corto_plazo: "10000.00", contado: "8000.00" });
    expect(v.plan_credito).toEqual({
      plazo_meses: 12,
      enganche: "1000.00",
      parcialidad: "1000.00",
      frec_pago: "MENSUAL",
    });
    expect(v.dia_cobranza).toEqual({ semana: "VIERNES", mes: null });
    expect(v.nota).toBe("venta plan 12 meses");
    expect(v.productos).toHaveLength(1);
    expect(v.productos[0].articulo).toBe("SILLA MARRON");
    expect(v.vendedores).toHaveLength(1);
    expect(v.combos).toEqual([]);
    expect(v.imagenes).toEqual([]);
  });

  it("populates sentinel defaults for VentaV2-only response fields", () => {
    const v = crearVentaBodyToVentaV2(makeValidBody())!;
    expect(v.estado).toBe("active");
    expect(v.situacion).toBe("borrador");
    expect(v.sincronizacion).toBe("pendiente");
    expect(v.microsip_folio).toBeNull();
    expect(v.microsip_docto_pv_id).toBeNull();
    expect(v.microsip_aplicada_at).toBeNull();
    expect(v.cancelacion).toBeNull();
    expect(v.aprobacion).toBeNull();
    expect(typeof v.created_at).toBe("string");
    expect(typeof v.updated_at).toBe("string");
    expect(typeof v.created_by).toBe("string");
    expect(typeof v.updated_by).toBe("string");
  });

  it("returns null when the body is not venta-shaped", () => {
    expect(crearVentaBodyToVentaV2(null)).toBeNull();
    expect(crearVentaBodyToVentaV2({})).toBeNull();
    expect(crearVentaBodyToVentaV2({ cliente: { nombre: "x" } })).toBeNull();
  });

  it("treats absent optional cliente.cliente_id as null", () => {
    const body = makeValidBody();
    const cliente = body.cliente as Record<string, unknown>;
    delete cliente.cliente_id;
    delete cliente.telefono;
    delete cliente.aval;
    delete cliente.referencia;
    const v = crearVentaBodyToVentaV2(body)!;
    expect(v.cliente.cliente_id).toBeNull();
    expect(v.cliente.telefono).toBeNull();
    expect(v.cliente.aval).toBeNull();
    expect(v.cliente.referencia).toBeNull();
  });

  it("treats absent plan_credito / dia_cobranza / nota as null", () => {
    const body = makeValidBody();
    delete body.plan_credito;
    delete body.dia_cobranza;
    delete body.nota;
    const v = crearVentaBodyToVentaV2(body)!;
    expect(v.plan_credito).toBeNull();
    expect(v.dia_cobranza).toBeNull();
    expect(v.nota).toBeNull();
  });

  it("maps dia_cobranza.mes to {semana:null, mes:N}", () => {
    const body = makeValidBody();
    body.dia_cobranza = { mes: 15 };
    const v = crearVentaBodyToVentaV2(body)!;
    expect(v.dia_cobranza).toEqual({ semana: null, mes: 15 });
  });

  it("defaults combos array to empty when missing", () => {
    const body = makeValidBody();
    delete body.combos;
    const v = crearVentaBodyToVentaV2(body)!;
    expect(v.combos).toEqual([]);
  });

  it("maps a producto inside a combo with null almacenes", () => {
    const body = makeValidBody();
    body.combos = [
      {
        id: "c1",
        nombre: "COMBO ALCOBA",
        precio_anual: "12000.00",
        precio_corto: "10000.00",
        precio_contado: "8000.00",
        cantidad: "1",
        almacen_origen_id: 1,
        almacen_destino_id: 2,
      },
    ];
    body.productos = [
      {
        id: "p1",
        articulo_id: 100,
        articulo: "CAMA",
        cantidad: "1",
        precio_anual: "0",
        precio_corto: "0",
        precio_contado: "0",
        combo_id: "c1",
      },
    ];
    const v = crearVentaBodyToVentaV2(body)!;
    expect(v.productos[0].combo_id).toBe("c1");
    expect(v.productos[0].almacen_origen_id).toBeNull();
    expect(v.productos[0].almacen_destino_id).toBeNull();
    expect(v.combos).toHaveLength(1);
  });
});
