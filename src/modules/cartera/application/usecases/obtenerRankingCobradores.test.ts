import { describe, it, expect } from "vitest";
import { obtenerRankingCobradores } from "./obtenerRankingCobradores";
import { FakeCarteraPort, makeFakeCobradorPerformance } from "../__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";

describe("obtenerRankingCobradores", () => {
  it("forwards filters to the port", async () => {
    const port = new FakeCarteraPort();
    port.cobradoresResponse = [makeFakeCobradorPerformance()];

    await obtenerRankingCobradores(port, { zona: "ZONA_NORTE", cobrador: "1", periodo: "2025-10" });

    expect(port.cobradoresCalls).toHaveLength(1);
    expect(port.cobradoresCalls[0].filters).toEqual({
      zona: "ZONA_NORTE",
      cobrador: "1",
      periodo: "2025-10",
    });
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeCarteraPort();
    const ctrl = new AbortController();
    await obtenerRankingCobradores(port, {}, ctrl.signal);
    expect(port.cobradoresCalls[0].signal).toBe(ctrl.signal);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeCarteraPort();
    port.cobradoresResponse = [makeFakeCobradorPerformance({ cobradorId: 7, cei: "0.92" })];

    const result = await obtenerRankingCobradores(port, {});
    expect(result).toHaveLength(1);
    expect(result[0].cobradorId).toBe(7);
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeCarteraPort();
    const err = new DomainError("forbidden", "no tienes permisos");
    port.throwOnNext.obtenerCobradores = err;
    await expect(obtenerRankingCobradores(port, {})).rejects.toBe(err);
  });
});
