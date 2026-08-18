import { describe, expect, it } from "vitest";

import { normalizarCiudad } from "./normalizarCiudad";

describe("normalizarCiudad", () => {
  it("espeja al normalizador del servidor: acentos, mayúsculas y espacios", () => {
    expect(normalizarCiudad("Tehuacán")).toBe("TEHUACAN");
    expect(normalizarCiudad("COYOMEAPAN ")).toBe("COYOMEAPAN");
    expect(normalizarCiudad("  san   gabriel  chilac ")).toBe("SAN GABRIEL CHILAC");
    expect(normalizarCiudad("Cañada")).toBe("CANADA");
  });

  it("una ciudad fuera del catálogo no se normaliza a otra", () => {
    expect(normalizarCiudad("SAN JUAN DEL RIO")).not.toBe(normalizarCiudad("SAN GABRIEL CHILAC"));
  });
});
