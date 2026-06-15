import { describe, expect, it } from "vitest";
import { EstadoPago } from "./EstadoPago";
import { DomainError } from "../errors";

describe("EstadoPago", () => {
  it("accepts each of the 5 backend estados de pago", () => {
    for (const s of EstadoPago.values()) {
      const v = EstadoPago.create(s);
      expect(v).toBeInstanceOf(EstadoPago);
      expect((v as EstadoPago).value).toBe(s);
    }
  });

  it("rejects an unknown string with a stable code", () => {
    const v = EstadoPago.create("PENDIENTE");
    expect(v).toBeInstanceOf(DomainError);
    expect((v as DomainError).code).toBe("estado_pago_invalido");
  });

  it("rejects the empty string", () => {
    expect(EstadoPago.create("")).toBeInstanceOf(DomainError);
  });

  it("error message contains the invalid input", () => {
    const v = EstadoPago.create("CANCELADO") as DomainError;
    expect(v.message).toContain("CANCELADO");
  });

  it("equality compares by value", () => {
    const a = EstadoPago.create("AL_CORRIENTE") as EstadoPago;
    const b = EstadoPago.create("AL_CORRIENTE") as EstadoPago;
    const c = EstadoPago.create("MOROSO") as EstadoPago;
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
