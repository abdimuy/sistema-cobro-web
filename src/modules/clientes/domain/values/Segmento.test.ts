import { describe, expect, it } from "vitest";
import { Segmento } from "./Segmento";
import { DomainError } from "../errors";

describe("Segmento", () => {
  it("accepts each of the 6 backend segmentos", () => {
    for (const s of Segmento.values()) {
      const v = Segmento.create(s);
      expect(v).toBeInstanceOf(Segmento);
      expect((v as Segmento).value).toBe(s);
    }
  });

  it("rejects an unknown string with a stable code", () => {
    const v = Segmento.create("DESCONOCIDO");
    expect(v).toBeInstanceOf(DomainError);
    expect((v as DomainError).code).toBe("segmento_invalido");
  });

  it("rejects the empty string", () => {
    expect(Segmento.create("")).toBeInstanceOf(DomainError);
  });

  it("error message contains the invalid input", () => {
    const v = Segmento.create("INVALIDO") as DomainError;
    expect(v.message).toContain("INVALIDO");
  });

  it("equality compares by value", () => {
    const a = Segmento.create("ACTIVO") as Segmento;
    const b = Segmento.create("ACTIVO") as Segmento;
    const c = Segmento.create("FRIO") as Segmento;
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
