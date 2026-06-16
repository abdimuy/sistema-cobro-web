import { describe, expect, it } from "vitest";
import { obtenerFichaCliente } from "./obtenerFichaCliente";
import {
  FakeClientesPort,
  makeFakeFichaCliente,
} from "../__tests__/fakeClientesPort";
import { DomainError } from "../../domain/errors";

describe("obtenerFichaCliente", () => {
  it("forwards clienteId to the port", async () => {
    const port = new FakeClientesPort();
    port.fichaResponse = makeFakeFichaCliente({ clienteId: 1042 });

    await obtenerFichaCliente(port, 1042);

    expect(port.fichaCalls).toHaveLength(1);
    expect(port.fichaCalls[0].clienteId).toBe(1042);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeClientesPort();
    port.fichaResponse = makeFakeFichaCliente({ clienteId: 5555 });

    const out = await obtenerFichaCliente(port, 5555);
    expect(out.clienteId).toBe(5555);
    expect(out.nombre).toBe("MUEBLES HERNÁNDEZ S.A.");
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeClientesPort();
    const ctrl = new AbortController();
    await obtenerFichaCliente(port, 1042, ctrl.signal);
    expect(port.fichaCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects zero clienteId with code cliente_id_invalido", async () => {
    const port = new FakeClientesPort();
    const err = obtenerFichaCliente(port, 0);
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "cliente_id_invalido" });
  });

  it("rejects negative clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerFichaCliente(port, -1)).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-integer clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(obtenerFichaCliente(port, 1.5)).rejects.toBeInstanceOf(DomainError);
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeClientesPort();
    const e = new DomainError("not_found", "cliente no encontrado");
    port.throwOnNext.obtenerFicha = e;
    await expect(obtenerFichaCliente(port, 1042)).rejects.toBe(e);
  });
});
