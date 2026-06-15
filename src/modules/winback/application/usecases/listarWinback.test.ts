import { describe, expect, it } from "vitest";
import { listarWinback } from "./listarWinback";
import {
  FakeWinbackPort,
  makeFakeWinbackItem,
} from "../__tests__/fakeWinbackPort";
import { DomainError } from "../../domain/errors";

describe("listarWinback", () => {
  it("forwards all input fields to the port verbatim", async () => {
    const port = new FakeWinbackPort();
    port.listarResponse = { items: [makeFakeWinbackItem()] };

    const out = await listarWinback(port, {
      segmento: "DORMIDO_VALIOSO",
      zona: "ZONA_NORTE",
      limit: 50,
      incluirControl: true,
      incluirActivos: false,
    });

    expect(port.listarCalls).toHaveLength(1);
    expect(port.listarCalls[0].input).toEqual({
      segmento: "DORMIDO_VALIOSO",
      zona: "ZONA_NORTE",
      limit: 50,
      incluirControl: true,
      incluirActivos: false,
    });
    expect(out.items).toHaveLength(1);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeWinbackPort();
    const item = makeFakeWinbackItem({ clienteId: 9999 });
    port.listarResponse = { items: [item] };

    const out = await listarWinback(port, {});
    expect(out.items[0].clienteId).toBe(9999);
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeWinbackPort();
    const ctrl = new AbortController();
    await listarWinback(port, { zona: "ZONA_SUR" }, ctrl.signal);
    expect(port.listarCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects non-positive limit values", async () => {
    const port = new FakeWinbackPort();
    await expect(listarWinback(port, { limit: 0 })).rejects.toBeInstanceOf(
      DomainError,
    );
    await expect(listarWinback(port, { limit: -5 })).rejects.toBeInstanceOf(
      DomainError,
    );
  });

  it("rejects non-integer limit values", async () => {
    const port = new FakeWinbackPort();
    await expect(
      listarWinback(port, { limit: 10.5 }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects limit > 100 with code limit_excedido", async () => {
    const port = new FakeWinbackPort();
    const err = listarWinback(port, { limit: 101 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "limit_excedido" });
  });

  it("allows limit exactly at 100", async () => {
    const port = new FakeWinbackPort();
    await expect(listarWinback(port, { limit: 100 })).resolves.toBeDefined();
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeWinbackPort();
    const e = new DomainError("network_error", "fallo de red");
    port.throwOnNext.listarItems = e;
    await expect(listarWinback(port, {})).rejects.toBe(e);
  });
});
