import { describe, expect, it } from "vitest";
import { estatusClienteInfo, permiteAplicar } from "./estatusCliente";

describe("estatusClienteInfo", () => {
  it("maps A to Activo / verde", () => {
    expect(estatusClienteInfo("A")).toEqual(
      expect.objectContaining({ label: "Activo", tone: "verde" })
    );
  });

  it("maps B to Baja / gris", () => {
    expect(estatusClienteInfo("B")).toEqual(
      expect.objectContaining({ label: "Baja", tone: "gris" })
    );
  });

  it("maps V to Suspensión de ventas / rojo", () => {
    expect(estatusClienteInfo("V")).toEqual(
      expect.objectContaining({ label: "Suspensión de ventas", tone: "rojo" })
    );
  });

  it("maps C to Suspensión de créditos / rojoOscuro", () => {
    expect(estatusClienteInfo("C")).toEqual(
      expect.objectContaining({ label: "Suspensión de créditos", tone: "rojoOscuro" })
    );
  });

  it("normalizes lowercase and surrounding whitespace", () => {
    expect(estatusClienteInfo(" v ")).toEqual(
      expect.objectContaining({ label: "Suspensión de ventas", tone: "rojo" })
    );
  });

  it("returns null for unknown values", () => {
    expect(estatusClienteInfo("X")).toBeNull();
  });

  it("returns null for null", () => {
    expect(estatusClienteInfo(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(estatusClienteInfo(undefined)).toBeNull();
  });
});

describe("permiteAplicar", () => {
  it("allows A", () => {
    expect(permiteAplicar("A")).toBe(true);
  });

  it("allows B", () => {
    expect(permiteAplicar("B")).toBe(true);
  });

  it("blocks V", () => {
    expect(permiteAplicar("V")).toBe(false);
  });

  it("blocks C", () => {
    expect(permiteAplicar("C")).toBe(false);
  });

  it("allows null (falla abierta)", () => {
    expect(permiteAplicar(null)).toBe(true);
  });

  it("allows undefined (falla abierta)", () => {
    expect(permiteAplicar(undefined)).toBe(true);
  });

  it("allows empty string (falla abierta)", () => {
    expect(permiteAplicar("")).toBe(true);
  });

  it("normalizes lowercase and whitespace before blocking", () => {
    expect(permiteAplicar("  v  ")).toBe(false);
  });

  it("allows an unknown estatus (no inventamos reglas)", () => {
    expect(permiteAplicar("X")).toBe(true);
  });
});
