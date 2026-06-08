import { describe, expect, it } from "vitest";
import { crearVentaBodyToVentaV2WithCorrections } from "./crearVentaBodyToVentaV2WithCorrections";

function makeValidBody(): Record<string, unknown> {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: { cliente_id: 7, nombre: "CARLOS MENDEZ", telefono: "+524491234567" },
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

describe("crearVentaBodyToVentaV2WithCorrections", () => {
  it("returns null venta when the body is not venta-shaped", () => {
    const result = crearVentaBodyToVentaV2WithCorrections({ foo: "bar" });
    expect(result.venta).toBeNull();
    expect(result.corrections).toEqual([]);
  });

  it("returns no corrections when every value is valid", () => {
    const result = crearVentaBodyToVentaV2WithCorrections(makeValidBody());
    expect(result.venta).not.toBeNull();
    expect(result.corrections).toEqual([]);
  });

  it("records a correction when cliente.telefono fails E.164", () => {
    const body = makeValidBody();
    (body.cliente as Record<string, unknown>).telefono = "+ABC123";
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    expect(corrections).toHaveLength(1);
    expect(corrections[0]).toMatchObject({
      path: "cliente.telefono",
      before: "+ABC123",
      after: null,
      reason: expect.stringContaining("E.164"),
    });
  });

  it("records a correction when cliente.nombre is empty", () => {
    const body = makeValidBody();
    (body.cliente as Record<string, unknown>).nombre = "";
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    expect(corrections).toContainEqual(
      expect.objectContaining({
        path: "cliente.nombre",
        before: "",
        after: "SIN NOMBRE",
      }),
    );
  });

  it("records a correction when montos.anual is not a valid decimal", () => {
    const body = makeValidBody();
    (body.montos as Record<string, unknown>).anual = "not-a-number";
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    expect(corrections).toContainEqual(
      expect.objectContaining({
        path: "montos.anual",
        before: "not-a-number",
        after: "0.00",
      }),
    );
  });

  it("records a correction when GPS is out of range", () => {
    const body = makeValidBody();
    (body.gps as Record<string, unknown>).latitud = 999;
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    expect(corrections).toContainEqual(
      expect.objectContaining({
        path: "gps.latitud",
        before: 999,
        after: 90,
      }),
    );
  });

  it("records a correction when plan_credito.plazo_meses is below 1", () => {
    const body = makeValidBody();
    body.plan_credito = {
      plazo_meses: 0,
      enganche: "100.00",
      parcialidad: "100.00",
      frec_pago: "MENSUAL",
    };
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    expect(corrections).toContainEqual(
      expect.objectContaining({
        path: "plan_credito.plazo_meses",
        before: 0,
        after: 1,
      }),
    );
  });

  it("records a correction when plan_credito.frec_pago is invalid", () => {
    const body = makeValidBody();
    body.plan_credito = {
      plazo_meses: 12,
      enganche: "100.00",
      parcialidad: "100.00",
      frec_pago: "DIARIO",
    };
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    expect(corrections).toContainEqual(
      expect.objectContaining({
        path: "plan_credito.frec_pago",
        before: "DIARIO",
        after: "MENSUAL",
      }),
    );
  });

  it("records a correction when producto almacenes are equal", () => {
    const body = makeValidBody();
    (body.productos as Array<Record<string, unknown>>)[0].almacen_origen_id = 5;
    (body.productos as Array<Record<string, unknown>>)[0].almacen_destino_id = 5;
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    expect(corrections).toContainEqual(
      expect.objectContaining({
        path: "productos[0].almacen_destino_id",
      }),
    );
  });

  it("records a correction when producto.cantidad is zero", () => {
    const body = makeValidBody();
    (body.productos as Array<Record<string, unknown>>)[0].cantidad = "0";
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    expect(corrections).toContainEqual(
      expect.objectContaining({
        path: "productos[0].cantidad",
        before: "0",
        after: "1",
      }),
    );
  });

  it("collects multiple corrections in a single pass", () => {
    const body = makeValidBody();
    (body.cliente as Record<string, unknown>).telefono = "BAD";
    (body.montos as Record<string, unknown>).anual = "BAD";
    (body.gps as Record<string, unknown>).latitud = 999;
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    const paths = corrections.map((c) => c.path);
    expect(paths).toEqual(
      expect.arrayContaining(["cliente.telefono", "montos.anual", "gps.latitud"]),
    );
  });

  it("each correction has a non-empty reason", () => {
    const body = makeValidBody();
    (body.cliente as Record<string, unknown>).telefono = "BAD";
    (body.montos as Record<string, unknown>).anual = "BAD";
    const { corrections } = crearVentaBodyToVentaV2WithCorrections(body);
    for (const c of corrections) {
      expect(c.reason).toBeTruthy();
      expect(typeof c.reason).toBe("string");
    }
  });
});
