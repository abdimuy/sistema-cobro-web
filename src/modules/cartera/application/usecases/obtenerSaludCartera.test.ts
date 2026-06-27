import { describe, it, expect } from "vitest";
import { obtenerSaludCartera } from "./obtenerSaludCartera";
import { FakeCarteraPort, makeFakeSaludCartera } from "../__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";

describe("obtenerSaludCartera", () => {
  it("forwards filters to the port", async () => {
    const port = new FakeCarteraPort();
    port.saludResponse = makeFakeSaludCartera();

    await obtenerSaludCartera(port, { zona: "ZONA_NORTE", cobrador: "1", periodo: "2025-10" });

    expect(port.saludCalls).toHaveLength(1);
    expect(port.saludCalls[0].filters).toEqual({
      zona: "ZONA_NORTE",
      cobrador: "1",
      periodo: "2025-10",
    });
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeCarteraPort();
    const ctrl = new AbortController();
    await obtenerSaludCartera(port, {}, ctrl.signal);
    expect(port.saludCalls[0].signal).toBe(ctrl.signal);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeCarteraPort();
    const fake = makeFakeSaludCartera({ saldoTotal: "999.00" });
    port.saludResponse = fake;

    const result = await obtenerSaludCartera(port, {});
    expect(result.saldoTotal).toBe("999.00");
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeCarteraPort();
    const err = new DomainError("forbidden", "no tienes permisos");
    port.throwOnNext.obtenerSalud = err;
    await expect(obtenerSaludCartera(port, {})).rejects.toBe(err);
  });
});
