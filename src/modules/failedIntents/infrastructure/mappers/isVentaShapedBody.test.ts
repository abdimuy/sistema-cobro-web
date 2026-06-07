import { describe, expect, it } from "vitest";
import { isVentaShapedBody } from "./isVentaShapedBody";

function makeValidBody(): Record<string, unknown> {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: { nombre: "Carlos" },
    direccion: {
      calle: "Av Aguascalientes",
      colonia: "Centro",
      poblacion: "Aguascalientes",
      ciudad: "Aguascalientes",
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
      },
    ],
    vendedores: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        usuario_id: "44444444-4444-4444-4444-444444444444",
        email: "v@muebleriamsp.mx",
        nombre: "Juan",
      },
    ],
  };
}

describe("isVentaShapedBody", () => {
  it("accepts a minimal valid CrearVentaBody", () => {
    expect(isVentaShapedBody(makeValidBody())).toBe(true);
  });

  it("rejects null and primitives", () => {
    expect(isVentaShapedBody(null)).toBe(false);
    expect(isVentaShapedBody(undefined)).toBe(false);
    expect(isVentaShapedBody("string")).toBe(false);
    expect(isVentaShapedBody(123)).toBe(false);
    expect(isVentaShapedBody([])).toBe(false);
  });

  it("rejects a body missing cliente.nombre", () => {
    const b = makeValidBody();
    delete (b as { cliente?: unknown }).cliente;
    expect(isVentaShapedBody(b)).toBe(false);
  });

  it("rejects when productos is missing or empty", () => {
    const b1 = makeValidBody();
    delete (b1 as { productos?: unknown }).productos;
    expect(isVentaShapedBody(b1)).toBe(false);

    const b2 = makeValidBody();
    b2.productos = [];
    expect(isVentaShapedBody(b2)).toBe(false);
  });

  it("rejects when vendedores is missing or empty", () => {
    const b1 = makeValidBody();
    delete (b1 as { vendedores?: unknown }).vendedores;
    expect(isVentaShapedBody(b1)).toBe(false);

    const b2 = makeValidBody();
    b2.vendedores = [];
    expect(isVentaShapedBody(b2)).toBe(false);
  });

  it("rejects when montos is missing required fields", () => {
    const b = makeValidBody();
    b.montos = { anual: "1000.00" };
    expect(isVentaShapedBody(b)).toBe(false);
  });

  it("rejects when tipo_venta is invalid", () => {
    const b = makeValidBody();
    b.tipo_venta = "OTRO";
    expect(isVentaShapedBody(b)).toBe(false);
  });

  it("rejects when gps fields are not numbers", () => {
    const b = makeValidBody();
    b.gps = { latitud: "abc", longitud: -102.29 };
    expect(isVentaShapedBody(b)).toBe(false);
  });
});
