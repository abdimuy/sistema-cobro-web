import { describe, expect, it } from "vitest";
import { obtenerTimeline } from "./obtenerTimeline";
import { FakeClientesPort, makeFakeTimeline } from "../__tests__/fakeClientesPort";
import { DomainError } from "../../domain/errors";

describe("obtenerTimeline", () => {
  it("forwards clienteId to the port", async () => {
    const port = new FakeClientesPort();
    await obtenerTimeline(port, 1042);
    expect(port.timelineCalls).toHaveLength(1);
    expect(port.timelineCalls[0].clienteId).toBe(1042);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeClientesPort();
    const out = await obtenerTimeline(port, 1042);
    expect(out).toHaveLength(makeFakeTimeline().length);
    expect(out[0].tipo).toBe("compra_credito");
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeClientesPort();
    const ctrl = new AbortController();
    await obtenerTimeline(port, 1042, ctrl.signal);
    expect(port.timelineCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects zero clienteId with code cliente_id_invalido", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerTimeline(port, 0)).rejects.toMatchObject({ code: "cliente_id_invalido" });
  });

  it("rejects negative clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerTimeline(port, -1)).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-integer clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerTimeline(port, 1.5)).rejects.toBeInstanceOf(DomainError);
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeClientesPort();
    const e = new DomainError("not_found", "cliente no encontrado");
    port.throwOnNext.obtenerTimeline = e;
    await expect(obtenerTimeline(port, 1042)).rejects.toBe(e);
  });
});
