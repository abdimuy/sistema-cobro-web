import { describe, expect, it } from "vitest";
import { obtenerVentaDetalle } from "./obtenerVentaDetalle";
import {
  FakeClientesPort,
  makeFakeVentaDetalle,
} from "../__tests__/fakeClientesPort";
import { DomainError } from "../../domain/errors";

describe("obtenerVentaDetalle", () => {
  it("forwards all input fields to the port verbatim", async () => {
    const port = new FakeClientesPort();
    port.obtenerDetalleResponse = makeFakeVentaDetalle();

    await obtenerVentaDetalle(port, { clienteId: 1042, doctoPvId: 30015 });

    expect(port.obtenerDetalleCalls).toHaveLength(1);
    expect(port.obtenerDetalleCalls[0].input).toEqual({
      clienteId: 1042,
      doctoPvId: 30015,
    });
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeClientesPort();
    const detalle = makeFakeVentaDetalle();
    port.obtenerDetalleResponse = detalle;

    const out = await obtenerVentaDetalle(port, {
      clienteId: 1042,
      doctoPvId: 30015,
    });
    expect(out.venta.doctoPvId).toBe(30015);
    expect(out.productos).toHaveLength(1);
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeClientesPort();
    const ctrl = new AbortController();
    await obtenerVentaDetalle(
      port,
      { clienteId: 1042, doctoPvId: 30015 },
      ctrl.signal,
    );
    expect(port.obtenerDetalleCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects zero clienteId with code cliente_id_invalido", async () => {
    const port = new FakeClientesPort();
    const err = obtenerVentaDetalle(port, { clienteId: 0, doctoPvId: 30015 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "cliente_id_invalido" });
  });

  it("rejects negative clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(
      obtenerVentaDetalle(port, { clienteId: -1, doctoPvId: 30015 }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-integer clienteId", async () => {
    const port = new FakeClientesPort();
    await expect(
      obtenerVentaDetalle(port, { clienteId: 1.5, doctoPvId: 30015 }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects zero doctoPvId with code docto_pv_id_invalido", async () => {
    const port = new FakeClientesPort();
    const err = obtenerVentaDetalle(port, { clienteId: 1042, doctoPvId: 0 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "docto_pv_id_invalido" });
  });

  it("rejects negative doctoPvId", async () => {
    const port = new FakeClientesPort();
    await expect(
      obtenerVentaDetalle(port, { clienteId: 1042, doctoPvId: -1 }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-integer doctoPvId", async () => {
    const port = new FakeClientesPort();
    await expect(
      obtenerVentaDetalle(port, { clienteId: 1042, doctoPvId: 30015.5 }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeClientesPort();
    const e = new DomainError("not_found", "venta no encontrada");
    port.throwOnNext.obtenerVentaDetalle = e;
    await expect(
      obtenerVentaDetalle(port, { clienteId: 1042, doctoPvId: 30015 }),
    ).rejects.toBe(e);
  });
});
