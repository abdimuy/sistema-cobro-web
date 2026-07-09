import { describe, expect, it } from "vitest";
import { estatusClienteInfo } from "./estatusCliente";

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

  it("maps V to Vetado / rojo", () => {
    expect(estatusClienteInfo("V")).toEqual(
      expect.objectContaining({ label: "Vetado", tone: "rojo" })
    );
  });

  it("maps C to Cancelado / rojoOscuro", () => {
    expect(estatusClienteInfo("C")).toEqual(
      expect.objectContaining({ label: "Cancelado", tone: "rojoOscuro" })
    );
  });

  it("normalizes lowercase and surrounding whitespace", () => {
    expect(estatusClienteInfo(" v ")).toEqual(
      expect.objectContaining({ label: "Vetado", tone: "rojo" })
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
