import { describe, it, expect } from "vitest";
import { obtenerCosechas } from "./obtenerCosechas";
import { FakeCarteraPort, makeFakeCosecha } from "../__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";

describe("obtenerCosechas", () => {
  it("forwards filters to the port", async () => {
    const port = new FakeCarteraPort();
    port.cosechasResponse = [makeFakeCosecha()];

    await obtenerCosechas(port, { zona: "ZONA_NORTE", cobrador: "1", periodo: "2025-10" });

    expect(port.cosechasCalls).toHaveLength(1);
    expect(port.cosechasCalls[0].filters).toEqual({
      zona: "ZONA_NORTE",
      cobrador: "1",
      periodo: "2025-10",
    });
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeCarteraPort();
    const ctrl = new AbortController();
    await obtenerCosechas(port, {}, ctrl.signal);
    expect(port.cosechasCalls[0].signal).toBe(ctrl.signal);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeCarteraPort();
    const cosecha = makeFakeCosecha({ cohortMonth: 24318, conteo: 42 });
    port.cosechasResponse = [cosecha];

    const result = await obtenerCosechas(port, {});
    expect(result).toHaveLength(1);
    expect(result[0].cohortMonth).toBe(24318);
    expect(result[0].conteo).toBe(42);
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeCarteraPort();
    const err = new DomainError("forbidden", "no tienes permisos");
    port.throwOnNext.obtenerCosechas = err;
    await expect(obtenerCosechas(port, {})).rejects.toBe(err);
  });
});
