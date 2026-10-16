import { describe, expect, it } from "vitest";
import { leerPreciosCatalogo, preciosParaLinea, type PreciosCatalogo } from "./preciosCatalogo";
import type { PrecioOrdenado } from "@/hooks/useGetAlmacenById";

// Forma real de GET /v2/almacenes/{id}/articulos (msp-api microsiphttp/dto.go).
const CADENA_REAL = "Precio de lista:6150.000000,Precio 4 Meses:4100.000000,Precio 1 Meses:3485.000000";
const ORDENADOS: PrecioOrdenado[] = [
  { tipo: "contado", precio_empresa_id: 42, nombre: "Precio 1 Meses", precio: "3485.000000" },
  { tipo: "corto_plazo", precio_empresa_id: 43, nombre: "Precio 4 Meses", precio: "4100.000000" },
  { tipo: "largo_plazo", precio_empresa_id: 44, nombre: "Precio de lista", precio: "6150.000000" },
];
const COMPLETO: PreciosCatalogo = { contado: 3485, corto: 4100, largo: 6150 };

describe("leerPreciosCatalogo · cadena vieja", () => {
  it("lee la cadena real del API por nombre (antes daba 0/0/0)", () => {
    expect(leerPreciosCatalogo({ PRECIOS: CADENA_REAL })).toEqual(COMPLETO);
  });

  it("no depende de la posición: mismo resultado con el orden invertido y otra lista en medio", () => {
    expect(
      leerPreciosCatalogo({
        PRECIOS: "Precio 1 Meses:3485.000000,Mayoreo:1000.000000,Precio 4 Meses:4100.000000,Precio de lista:6150.000000",
      }),
    ).toEqual(COMPLETO);
  });

  it("'Precio de Contado' también es contado, sin importar mayúsculas ni espacios", () => {
    expect(leerPreciosCatalogo({ PRECIOS: " precio  de CONTADO :3485.000000" })).toEqual({
      contado: 3485,
      corto: null,
      largo: null,
    });
  });

  it("un precio que falta queda null, no 0", () => {
    expect(leerPreciosCatalogo({ PRECIOS: "Precio de lista:6150.000000" })).toEqual({
      contado: null,
      corto: null,
      largo: 6150,
    });
  });

  it("precio 0, vacío o no numérico cuenta como ausente", () => {
    expect(
      leerPreciosCatalogo({ PRECIOS: "Precio de lista:0.000000,Precio 4 Meses:,Precio 1 Meses:abc" }),
    ).toEqual({ contado: null, corto: null, largo: null });
  });

  it("un tipo repetido con valores distintos es ambiguo y queda ausente", () => {
    expect(
      leerPreciosCatalogo({ PRECIOS: "Precio 1 Meses:3485.000000,Precio de Contado:3000.000000" }).contado,
    ).toBeNull();
  });

  it("cadena vacía: todo ausente", () => {
    expect(leerPreciosCatalogo({ PRECIOS: "" })).toEqual({ contado: null, corto: null, largo: null });
  });
});

describe("leerPreciosCatalogo · precios_ordenados", () => {
  it("se prefiere sobre la cadena vieja aunque ésta diga otra cosa", () => {
    expect(
      leerPreciosCatalogo({ PRECIOS: "Precio de lista:1.000000", PRECIOS_ORDENADOS: ORDENADOS }),
    ).toEqual(COMPLETO);
  });

  it("clasifica por `tipo`, no por posición ni nombre", () => {
    const desordenados = [ORDENADOS[2], { ...ORDENADOS[0], nombre: "Lista renombrada" }, ORDENADOS[1]];
    expect(leerPreciosCatalogo({ PRECIOS: "", PRECIOS_ORDENADOS: desordenados })).toEqual(COMPLETO);
  });

  it("un tipo omitido queda null", () => {
    expect(leerPreciosCatalogo({ PRECIOS: CADENA_REAL, PRECIOS_ORDENADOS: [ORDENADOS[0]] })).toEqual({
      contado: 3485,
      corto: null,
      largo: null,
    });
  });
});

describe("preciosParaLinea", () => {
  it("CONTADO: 0 / 0 / contado", () => {
    expect(preciosParaLinea(COMPLETO, "CONTADO")).toEqual({
      ok: true,
      precios: { precioAnual: 0, precioCortoPlazo: 0, precioContado: 3485 },
    });
  });

  it("CONTADO sin precio de contado: error explícito", () => {
    expect(preciosParaLinea({ ...COMPLETO, contado: null }, "CONTADO")).toEqual({
      ok: false,
      error: "el producto no tiene precio de contado en el catálogo",
    });
  });

  it("CRÉDITO: los tres precios del catálogo", () => {
    expect(preciosParaLinea(COMPLETO, "CREDITO")).toEqual({
      ok: true,
      precios: { precioAnual: 6150, precioCortoPlazo: 4100, precioContado: 3485 },
    });
  });

  it("CRÉDITO sin precio anual: error, nunca una línea con anual 0", () => {
    expect(preciosParaLinea({ ...COMPLETO, largo: null }, "CREDITO")).toEqual({
      ok: false,
      error: "el producto no tiene precio anual en el catálogo",
    });
  });

  it("CRÉDITO: el error nombra todos los que faltan", () => {
    expect(preciosParaLinea({ contado: null, corto: null, largo: 6150 }, "CREDITO")).toEqual({
      ok: false,
      error: "el producto no tiene precio corto plazo, contado en el catálogo",
    });
  });
});
