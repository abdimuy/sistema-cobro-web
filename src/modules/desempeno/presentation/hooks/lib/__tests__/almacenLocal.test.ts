import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { escribirLocal, leerLocal } from "../almacenLocal";

const esTexto = (v: unknown): v is string => typeof v === "string";

describe("almacenLocal", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("devuelve el defecto si no hay nada guardado", () => {
    expect(leerLocal("k", "bloques", esTexto)).toBe("bloques");
  });

  it("lee lo que escribió", () => {
    escribirLocal("k", "por_hora");
    expect(leerLocal("k", "bloques", esTexto)).toBe("por_hora");
  });

  it("JSON roto o forma inválida → defecto", () => {
    localStorage.setItem("k", "{roto");
    expect(leerLocal("k", "bloques", esTexto)).toBe("bloques");
    localStorage.setItem("k", "42");
    expect(leerLocal("k", "bloques", esTexto)).toBe("bloques");
  });

  it("almacenamiento bloqueado (ventana privada) no tumba la pantalla", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(leerLocal("k", "bloques", esTexto)).toBe("bloques");
    expect(() => escribirLocal("k", "puntos")).not.toThrow();
  });
});
