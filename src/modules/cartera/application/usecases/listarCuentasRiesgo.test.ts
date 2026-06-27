import { describe, it, expect } from "vitest";
import { listarCuentasRiesgo } from "./listarCuentasRiesgo";
import { FakeCarteraPort, makeFakeCuentaRiesgo } from "../__tests__/fakeCarteraPort";
import { DomainError } from "../../domain/errors";

describe("listarCuentasRiesgo", () => {
  it("forwards filters to the port", async () => {
    const port = new FakeCarteraPort();
    port.cuentasRiesgoResponse = [makeFakeCuentaRiesgo()];

    await listarCuentasRiesgo(port, { zona: "ZONA_NORTE", cobrador: "1", periodo: "2025-10" });

    expect(port.cuentasRiesgoCalls).toHaveLength(1);
    expect(port.cuentasRiesgoCalls[0].filters).toEqual({
      zona: "ZONA_NORTE",
      cobrador: "1",
      periodo: "2025-10",
    });
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeCarteraPort();
    const ctrl = new AbortController();
    await listarCuentasRiesgo(port, {}, ctrl.signal);
    expect(port.cuentasRiesgoCalls[0].signal).toBe(ctrl.signal);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeCarteraPort();
    port.cuentasRiesgoResponse = [makeFakeCuentaRiesgo({ clienteId: 2002, saldo: "99000.00" })];

    const result = await listarCuentasRiesgo(port, {});
    expect(result).toHaveLength(1);
    expect(result[0].clienteId).toBe(2002);
  });

  it("propagates port errors without wrapping", async () => {
    const port = new FakeCarteraPort();
    const err = new DomainError("forbidden", "no tienes permisos");
    port.throwOnNext.obtenerCuentasRiesgo = err;
    await expect(listarCuentasRiesgo(port, {})).rejects.toBe(err);
  });
});
