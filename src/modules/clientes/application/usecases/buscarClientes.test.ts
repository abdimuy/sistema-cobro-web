import { describe, expect, it } from "vitest";
import { buscarClientes } from "./buscarClientes";
import {
  FakeClientesPort,
  makeFakeCliente,
} from "../__tests__/fakeClientesPort";
import { DomainError } from "../../domain/errors";

describe("buscarClientes", () => {
  it("forwards all input fields to the port verbatim", async () => {
    const port = new FakeClientesPort();
    port.buscarResponse = { items: [makeFakeCliente()], nextCursor: "" };

    const out = await buscarClientes(port, {
      q: "hernandez",
      zona: 1,
      cobrador: 3,
      conSaldo: true,
      segmento: "DORMIDO_VALIOSO",
      estadoPago: "AL_CORRIENTE",
      scoreMin: 50,
      cursor: "abc",
      limit: 20,
    });

    expect(port.buscarCalls).toHaveLength(1);
    expect(port.buscarCalls[0].input).toEqual({
      q: "hernandez",
      zona: 1,
      cobrador: 3,
      conSaldo: true,
      segmento: "DORMIDO_VALIOSO",
      estadoPago: "AL_CORRIENTE",
      scoreMin: 50,
      cursor: "abc",
      limit: 20,
    });
    expect(out.items).toHaveLength(1);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeClientesPort();
    const cliente = makeFakeCliente({ clienteId: 9999 });
    port.buscarResponse = { items: [cliente], nextCursor: "cursor-next" };

    const out = await buscarClientes(port, {});
    expect(out.items[0].clienteId).toBe(9999);
    expect(out.nextCursor).toBe("cursor-next");
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeClientesPort();
    const ctrl = new AbortController();
    await buscarClientes(port, { zona: 2 }, ctrl.signal);
    expect(port.buscarCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects non-positive limit values", async () => {
    const port = new FakeClientesPort();
    await expect(buscarClientes(port, { limit: 0 })).rejects.toBeInstanceOf(DomainError);
    await expect(buscarClientes(port, { limit: -5 })).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-integer limit values", async () => {
    const port = new FakeClientesPort();
    await expect(buscarClientes(port, { limit: 10.5 })).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects limit > 200 with code limit_excedido", async () => {
    const port = new FakeClientesPort();
    const err = buscarClientes(port, { limit: 201 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "limit_excedido" });
  });

  it("allows limit exactly at 200", async () => {
    const port = new FakeClientesPort();
    await expect(buscarClientes(port, { limit: 200 })).resolves.toBeDefined();
  });

  it("rejects scoreMin below 0 with code score_min_invalido", async () => {
    const port = new FakeClientesPort();
    const err = buscarClientes(port, { scoreMin: -1 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "score_min_invalido" });
  });

  it("rejects scoreMin above 100 with code score_min_invalido", async () => {
    const port = new FakeClientesPort();
    const err = buscarClientes(port, { scoreMin: 101 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "score_min_invalido" });
  });

  it("rejects non-integer scoreMin", async () => {
    const port = new FakeClientesPort();
    await expect(buscarClientes(port, { scoreMin: 50.5 })).rejects.toBeInstanceOf(DomainError);
  });

  it("allows scoreMin at boundaries 0 and 100", async () => {
    const port = new FakeClientesPort();
    await expect(buscarClientes(port, { scoreMin: 0 })).resolves.toBeDefined();
    await expect(buscarClientes(port, { scoreMin: 100 })).resolves.toBeDefined();
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeClientesPort();
    const e = new DomainError("network_error", "fallo de red");
    port.throwOnNext.buscarClientes = e;
    await expect(buscarClientes(port, {})).rejects.toBe(e);
  });
});
