import { describe, expect, it } from "vitest";

import { preciosDeLineas } from "./preciosDeLineas";
import type {
  ComboFormData,
  ProductoFormData,
} from "./hooks/useVentaEditState";

const producto = (o: Partial<ProductoFormData> = {}): ProductoFormData => ({
  id: "p",
  articuloId: 1,
  articulo: "SILLA",
  cantidad: 1,
  precioAnual: 1000,
  precioCortoPlazo: 900,
  precioContado: 800,
  comboID: null,
  almacenOrigenID: 1,
  almacenDestinoID: 2,
  ...o,
});

const combo = (o: Partial<ComboFormData> = {}): ComboFormData => ({
  id: "c",
  nombre: "SALA 3 PIEZAS",
  precioAnual: 5000,
  precioCortoPlazo: 4500,
  precioContado: 4000,
  cantidad: 1,
  almacenOrigenID: 1,
  almacenDestinoID: 2,
  ...o,
});

describe("preciosDeLineas", () => {
  it("suma precio × cantidad en los tres niveles", () => {
    expect(preciosDeLineas([producto({ cantidad: 8 })], [])).toEqual({
      anual: 8000,
      cortoPlazo: 7200,
      contado: 6400,
    });
  });

  it("el combo suma por su precio y sus hijos NO suman aparte", () => {
    // La divergencia real: la copia del replay ignoraba el combo y sumaba a
    // sus hijos, y daba 800 + 2400 + 2100 = 5300 donde la venta vale 4800.
    const precios = preciosDeLineas(
      [
        producto({ id: "suelto" }),
        producto({ id: "hijo-1", comboID: "c", precioContado: 2400 }),
        producto({ id: "hijo-2", comboID: "c", precioContado: 2100 }),
      ],
      [combo()],
    );

    expect(precios.contado).toBe(4800);
  });

  it("el combo suma por su cantidad, no una sola vez", () => {
    expect(preciosDeLineas([], [combo({ cantidad: 3 })]).contado).toBe(12000);
  });

  it("las líneas borradas no suman", () => {
    const precios = preciosDeLineas(
      [producto(), producto({ id: "borrado", isDeleted: true })],
      [combo({ isDeleted: true })],
    );

    expect(precios).toEqual({ anual: 1000, cortoPlazo: 900, contado: 800 });
  });

  it("un hijo de combo borrado tampoco cambia nada, porque nunca sumaba", () => {
    const conHijo = preciosDeLineas([producto({ id: "h", comboID: "c" })], [combo()]);
    const sinHijo = preciosDeLineas([], [combo()]);

    expect(conHijo).toEqual(sinHijo);
  });

  it("sin líneas da cero, no NaN", () => {
    expect(preciosDeLineas([], [])).toEqual({ anual: 0, cortoPlazo: 0, contado: 0 });
  });
});
