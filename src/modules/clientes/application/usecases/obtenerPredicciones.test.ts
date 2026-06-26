import { describe, expect, it } from "vitest";
import { obtenerPredicciones } from "./obtenerPredicciones";
import {
  FakeClientesPort,
  makeFakePredicciones,
} from "../__tests__/fakeClientesPort";
import { DomainError } from "../../domain/errors";

describe("obtenerPredicciones", () => {
  it("forwards clienteId to the port", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones();

    await obtenerPredicciones(port, 1042);

    expect(port.predicionesCalls).toHaveLength(1);
    expect(port.predicionesCalls[0].clienteId).toBe(1042);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeClientesPort();
    port.prediccionesResponse = makeFakePredicciones();

    const out = await obtenerPredicciones(port, 1042);
    expect(out.disponible).toBe(true);
    expect(out.pAlive.punto).toBe(0.82);
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeClientesPort();
    const ctrl = new AbortController();
    await obtenerPredicciones(port, 1042, ctrl.signal);
    expect(port.predicionesCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects zero clienteId with code cliente_id_invalido", async () => {
    const port = new FakeClientesPort();
    const err = obtenerPredicciones(port, 0);
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "cliente_id_invalido" });
  });

  it("rejects negative clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerPredicciones(port, -1)).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-integer clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerPredicciones(port, 1.5)).rejects.toBeInstanceOf(DomainError);
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeClientesPort();
    const e = new DomainError("not_found", "cliente no encontrado");
    port.throwOnNext.obtenerPredicciones = e;
    await expect(obtenerPredicciones(port, 1042)).rejects.toBe(e);
  });
});
