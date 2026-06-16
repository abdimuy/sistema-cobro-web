import { describe, expect, it } from "vitest";
import { listarVentasCliente } from "./listarVentasCliente";
import {
  FakeClientesPort,
  makeFakeVentaCliente,
} from "../__tests__/fakeClientesPort";
import { DomainError } from "../../domain/errors";

describe("listarVentasCliente", () => {
  it("forwards all input fields to the port verbatim", async () => {
    const port = new FakeClientesPort();
    port.listarVentasResponse = {
      items: [makeFakeVentaCliente()],
      nextCursor: "",
    };

    await listarVentasCliente(port, { clienteId: 1042, cursor: "x", limit: 10 });

    expect(port.listarVentasCalls).toHaveLength(1);
    expect(port.listarVentasCalls[0].input).toEqual({
      clienteId: 1042,
      cursor: "x",
      limit: 10,
    });
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeClientesPort();
    const venta = makeFakeVentaCliente({ doctoPvId: 77777 });
    port.listarVentasResponse = { items: [venta], nextCursor: "next-page" };

    const out = await listarVentasCliente(port, { clienteId: 1042 });
    expect(out.items[0].doctoPvId).toBe(77777);
    expect(out.nextCursor).toBe("next-page");
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeClientesPort();
    const ctrl = new AbortController();
    await listarVentasCliente(port, { clienteId: 1042 }, ctrl.signal);
    expect(port.listarVentasCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects zero clienteId with code cliente_id_invalido", async () => {
    const port = new FakeClientesPort();
    const err = listarVentasCliente(port, { clienteId: 0 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "cliente_id_invalido" });
  });

  it("rejects negative clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(
      listarVentasCliente(port, { clienteId: -10 }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-positive limit", async () => {
    const port = new FakeClientesPort();
    await expect(
      listarVentasCliente(port, { clienteId: 1042, limit: 0 }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-integer limit", async () => {
    const port = new FakeClientesPort();
    await expect(
      listarVentasCliente(port, { clienteId: 1042, limit: 5.5 }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects limit > 200 with code limit_excedido", async () => {
    const port = new FakeClientesPort();
    const err = listarVentasCliente(port, { clienteId: 1042, limit: 201 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "limit_excedido" });
  });

  it("allows limit exactly at 200", async () => {
    const port = new FakeClientesPort();
    await expect(
      listarVentasCliente(port, { clienteId: 1042, limit: 200 }),
    ).resolves.toBeDefined();
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeClientesPort();
    const e = new DomainError("network_error", "fallo de red");
    port.throwOnNext.listarVentas = e;
    await expect(listarVentasCliente(port, { clienteId: 1042 })).rejects.toBe(e);
  });
});
