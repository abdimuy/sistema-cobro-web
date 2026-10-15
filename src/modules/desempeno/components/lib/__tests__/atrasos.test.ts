import { describe, expect, it } from "vitest";
import { CLASE_TONO_ATRASOS, textoDeAtrasos, tonoDeAtrasos } from "../atrasos";

// Mismos tramos y textos que el teléfono (PiezasDeLaLista.kt, textoDeAtrasos):
// < 1 al corriente (verde), 1–4 ámbar, 5+ rojo.
describe("atrasos de una cuenta", () => {
  it.each([
    [-6, "Al corriente", "ok"],
    [0, "Al corriente", "ok"],
    [1, "1 atraso", "ambar"],
    [4, "4 atrasos", "ambar"],
    [5, "5 atrasos", "rojo"],
  ] as const)("%i → %s (%s)", (n, texto, tono) => {
    expect(textoDeAtrasos(n)).toBe(texto);
    expect(tonoDeAtrasos(n)).toBe(tono);
  });

  it("nunca pinta un número negativo", () => {
    expect(textoDeAtrasos(-6)).not.toMatch(/-/);
  });

  it("cada tono tiene su color", () => {
    expect(CLASE_TONO_ATRASOS).toEqual({
      ok: "text-dsm-ok",
      ambar: "text-dsm-ambar",
      rojo: "text-dsm-rojo",
    });
  });
});
