import { describe, expect, it } from "vitest";

import { DomainError } from "../errors";
import { AlmacenesPair } from "./AlmacenesPair";

describe("AlmacenesPair", () => {
  it("acepta origen y destino distintos", () => {
    const r = AlmacenesPair.create(2, 1);
    expect(r).toBeInstanceOf(AlmacenesPair);
    expect((r as AlmacenesPair).origenID).toBe(2);
    expect((r as AlmacenesPair).destinoID).toBe(1);
  });

  it("acepta origen == destino (camioneta = almacén de exhibición)", () => {
    const r = AlmacenesPair.create(1, 1);
    expect(r).toBeInstanceOf(AlmacenesPair);
    expect((r as AlmacenesPair).origenID).toBe(1);
    expect((r as AlmacenesPair).destinoID).toBe(1);
  });

  it("rechaza ids no enteros positivos", () => {
    expect(AlmacenesPair.create(0, 1)).toBeInstanceOf(DomainError);
    expect(AlmacenesPair.create(1, -3)).toBeInstanceOf(DomainError);
    expect(AlmacenesPair.create(1.5, 2)).toBeInstanceOf(DomainError);
  });
});
