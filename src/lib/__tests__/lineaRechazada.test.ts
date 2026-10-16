import { describe, expect, it } from "vitest";
import { conLineaRechazada, conLineaRechazadaDeTexto, lineaRechazada } from "../lineaRechazada";
import { CUERPO_422_ARTICULO, CUERPO_422_COMBO, CUERPO_422_SIN_LINEA } from "./cuerposVentas422";

describe("lineaRechazada", () => {
  it("artículo", () => expect(lineaRechazada(CUERPO_422_ARTICULO)).toBe("Artículo: ROPERO 3 PUERTAS"));
  it("combo", () => expect(lineaRechazada(CUERPO_422_COMBO)).toBe("Combo: RECAMARA MATRIMONIAL"));
  it("sin línea: null", () => expect(lineaRechazada(CUERPO_422_SIN_LINEA)).toBeNull());
  it("sin `value` toma el nombre del message", () =>
    expect(lineaRechazada({ errors: [{ message: "articulo=SALA ROMA", location: "linea.articulo" }] })).toBe(
      "Artículo: SALA ROMA",
    ));
  it("los dos a la vez", () =>
    expect(
      lineaRechazada({ errors: [...CUERPO_422_ARTICULO.errors, CUERPO_422_COMBO.errors[1]] }),
    ).toBe("Artículo: ROPERO 3 PUERTAS · Combo: RECAMARA MATRIMONIAL"));
  it.each([null, undefined, "texto", {}, { errors: "x" }, { errors: [null, 3] }])("cuerpo raro %#: null", (c) =>
    expect(lineaRechazada(c)).toBeNull(),
  );
});

describe("conLineaRechazada", () => {
  it("añade la línea", () => expect(conLineaRechazada("msg", CUERPO_422_COMBO)).toBe("msg · Combo: RECAMARA MATRIMONIAL"));
  it("sin línea, igual", () => expect(conLineaRechazada("msg", CUERPO_422_SIN_LINEA)).toBe("msg"));
  it("desde texto JSON", () =>
    expect(conLineaRechazadaDeTexto("msg", JSON.stringify(CUERPO_422_ARTICULO))).toBe("msg · Artículo: ROPERO 3 PUERTAS"));
  it("texto truncado o no JSON, igual", () =>
    expect(conLineaRechazadaDeTexto("msg", JSON.stringify(CUERPO_422_ARTICULO).slice(0, 60))).toBe("msg"));
});
