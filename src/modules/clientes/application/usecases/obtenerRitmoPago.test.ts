import { describe, expect, it } from "vitest";
import { obtenerRitmoPago } from "./obtenerRitmoPago";
import {
  FakeClientesPort,
  makeFakeRitmoPago,
} from "../__tests__/fakeClientesPort";
import { DomainError } from "../../domain/errors";

describe("obtenerRitmoPago", () => {
  it("forwards clienteId to the port", async () => {
    const port = new FakeClientesPort();
    port.ritmoResponse = makeFakeRitmoPago();

    await obtenerRitmoPago(port, 1042);

    expect(port.ritmoCalls).toHaveLength(1);
    expect(port.ritmoCalls[0].clienteId).toBe(1042);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeClientesPort();
    port.ritmoResponse = makeFakeRitmoPago();

    const out = await obtenerRitmoPago(port, 1042);
    expect(out.anclaDiaRuta).toBe("lunes");
    expect(out.semanas).toHaveLength(4);
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeClientesPort();
    const ctrl = new AbortController();
    await obtenerRitmoPago(port, 1042, undefined, ctrl.signal);
    expect(port.ritmoCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects zero clienteId with code cliente_id_invalido", async () => {
    const port = new FakeClientesPort();
    const err = obtenerRitmoPago(port, 0);
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "cliente_id_invalido" });
  });

  it("rejects negative clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerRitmoPago(port, -1)).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-integer clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerRitmoPago(port, 1.5)).rejects.toBeInstanceOf(DomainError);
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeClientesPort();
    const e = new DomainError("not_found", "cliente no encontrado");
    port.throwOnNext.obtenerRitmoPago = e;
    await expect(obtenerRitmoPago(port, 1042)).rejects.toBe(e);
  });

  it("forwards range to the port", async () => {
    const port = new FakeClientesPort();
    const range = { desde: "2026-01-01", hasta: "2026-06-30" };
    await obtenerRitmoPago(port, 1042, range);
    expect(port.ritmoCalls[0].range).toEqual(range);
  });
});
