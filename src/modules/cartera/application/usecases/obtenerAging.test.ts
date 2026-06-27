import { describe, it, expect } from "vitest";
import { obtenerAging } from "./obtenerAging";
import { FakeCarteraPort, makeFakeAgingBucket } from "../__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";

describe("obtenerAging", () => {
  it("forwards filters to the port", async () => {
    const port = new FakeCarteraPort();
    port.agingResponse = [makeFakeAgingBucket()];

    await obtenerAging(port, { zona: "ZONA_NORTE", cobrador: "1", periodo: "2025-10" });

    expect(port.agingCalls).toHaveLength(1);
    expect(port.agingCalls[0].filters).toEqual({
      zona: "ZONA_NORTE",
      cobrador: "1",
      periodo: "2025-10",
    });
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeCarteraPort();
    const ctrl = new AbortController();
    await obtenerAging(port, {}, ctrl.signal);
    expect(port.agingCalls[0].signal).toBe(ctrl.signal);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeCarteraPort();
    port.agingResponse = [makeFakeAgingBucket({ bucket: "90+", saldo: "1.00" })];

    const result = await obtenerAging(port, {});
    expect(result).toHaveLength(1);
    expect(result[0].bucket).toBe("90+");
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeCarteraPort();
    const err = new DomainError("forbidden", "no tienes permisos");
    port.throwOnNext.obtenerAging = err;
    await expect(obtenerAging(port, {})).rejects.toBe(err);
  });
});
