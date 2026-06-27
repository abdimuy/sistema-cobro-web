import { describe, it, expect } from "vitest";
import { obtenerRollRate } from "./obtenerRollRate";
import { FakeCarteraPort, makeFakeRollRate } from "../__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";

describe("obtenerRollRate", () => {
  it("forwards filters to the port", async () => {
    const port = new FakeCarteraPort();
    port.rollRateResponse = makeFakeRollRate();

    await obtenerRollRate(port, { zona: "ZONA_NORTE", cobrador: "1", periodo: "2025-10" });

    expect(port.rollRateCalls).toHaveLength(1);
    expect(port.rollRateCalls[0].filters).toEqual({
      zona: "ZONA_NORTE",
      cobrador: "1",
      periodo: "2025-10",
    });
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeCarteraPort();
    const ctrl = new AbortController();
    await obtenerRollRate(port, {}, ctrl.signal);
    expect(port.rollRateCalls[0].signal).toBe(ctrl.signal);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeCarteraPort();
    port.rollRateResponse = makeFakeRollRate({ disponible: false, rollRate: 0 });

    const result = await obtenerRollRate(port, {});
    expect(result.disponible).toBe(false);
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeCarteraPort();
    const err = new DomainError("forbidden", "no tienes permisos");
    port.throwOnNext.obtenerRollRate = err;
    await expect(obtenerRollRate(port, {})).rejects.toBe(err);
  });
});
