import { describe, expect, it } from "vitest";
import { TipoVenta } from "./TipoVenta";
import { DomainError } from "../errors";

describe("TipoVenta", () => {
  it("accepts each of the 2 valid tipos de venta", () => {
    for (const t of TipoVenta.values()) {
      const v = TipoVenta.create(t);
      expect(v).toBeInstanceOf(TipoVenta);
      expect((v as TipoVenta).value).toBe(t);
    }
  });

  it("rejects an unknown string with a stable code", () => {
    const v = TipoVenta.create("APARTADO");
    expect(v).toBeInstanceOf(DomainError);
    expect((v as DomainError).code).toBe("tipo_venta_invalido");
  });

  it("rejects the empty string", () => {
    expect(TipoVenta.create("")).toBeInstanceOf(DomainError);
  });

  it("rejects lowercase values", () => {
    const v = TipoVenta.create("contado");
    expect(v).toBeInstanceOf(DomainError);
    expect((v as DomainError).code).toBe("tipo_venta_invalido");
  });

  it("error message contains the invalid input", () => {
    const v = TipoVenta.create("RENTA") as DomainError;
    expect(v.message).toContain("RENTA");
  });

  it("equality compares by value", () => {
    const a = TipoVenta.create("CONTADO") as TipoVenta;
    const b = TipoVenta.create("CONTADO") as TipoVenta;
    const c = TipoVenta.create("CREDITO") as TipoVenta;
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
