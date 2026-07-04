import { describe, expect, it } from "vitest";
import { buscarVentas } from "./buscarVentas";
import {
  FakeVentasListPort,
  makeFakeVentaLocal,
} from "../__tests__/fakeVentasListPort";
import { DomainError } from "../../domain/errors";

describe("buscarVentas", () => {
  it("forwards all input fields to the port verbatim", async () => {
    const port = new FakeVentasListPort();
    port.buscarResponse = { items: [makeFakeVentaLocal()], nextCursor: "" };

    const input = {
      search: "hernandez",
      tipoVenta: "CREDITO" as const,
      situacion: "aprobada" as const,
      sincronizacion: "aplicada" as const,
      zonaClienteId: 12,
      vendedorEmail: "maria.ramirez@muebleriamsp.mx",
      precioMin: 1000,
      precioMax: 20000,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-06-30",
      incluirCanceladas: false,
      sortBy: "fecha_venta" as const,
      sortOrder: "desc" as const,
      cursor: "cursor-abc",
      limit: 50,
    };

    const out = await buscarVentas(port, input);

    expect(port.buscarCalls).toHaveLength(1);
    expect(port.buscarCalls[0].input).toEqual(input);
    expect(out.items).toHaveLength(1);
  });

  it("returns the port response unchanged", async () => {
    const port = new FakeVentasListPort();
    const venta = makeFakeVentaLocal({ LOCAL_SALE_ID: "venta-9999" });
    port.buscarResponse = { items: [venta], nextCursor: "cursor-next" };

    const out = await buscarVentas(port, {});
    expect(out.items[0].LOCAL_SALE_ID).toBe("venta-9999");
    expect(out.nextCursor).toBe("cursor-next");
  });

  it("propagates the abort signal to the port", async () => {
    const port = new FakeVentasListPort();
    const ctrl = new AbortController();
    await buscarVentas(port, { zonaClienteId: 2 }, ctrl.signal);
    expect(port.buscarCalls[0].signal).toBe(ctrl.signal);
  });

  it("rejects non-positive limit values", async () => {
    const port = new FakeVentasListPort();
    await expect(buscarVentas(port, { limit: 0 })).rejects.toBeInstanceOf(DomainError);
    await expect(buscarVentas(port, { limit: -5 })).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects non-integer limit values", async () => {
    const port = new FakeVentasListPort();
    await expect(buscarVentas(port, { limit: 10.5 })).rejects.toBeInstanceOf(DomainError);
  });

  it("rejects limit > 500 with code limit_excedido", async () => {
    const port = new FakeVentasListPort();
    const err = buscarVentas(port, { limit: 501 });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "limit_excedido" });
  });

  it("allows limit exactly at 500", async () => {
    const port = new FakeVentasListPort();
    await expect(buscarVentas(port, { limit: 500 })).resolves.toBeDefined();
  });

  it("accepts each allowed sort_by column", async () => {
    const port = new FakeVentasListPort();
    const allowed = ["fecha_venta", "precio_total", "nombre_cliente"] as const;
    for (const sortBy of allowed) {
      await expect(buscarVentas(port, { sortBy })).resolves.toBeDefined();
    }
  });

  it("rejects an invalid sortBy with code sort_by_invalido", async () => {
    const port = new FakeVentasListPort();
    const err = buscarVentas(port, {
      sortBy: "ciudad" as unknown as "fecha_venta",
    });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "sort_by_invalido" });
  });

  it("rejects an invalid sortOrder with code sort_order_invalido", async () => {
    const port = new FakeVentasListPort();
    const err = buscarVentas(port, {
      sortBy: "fecha_venta",
      sortOrder: "ascending" as unknown as "asc",
    });
    await expect(err).rejects.toBeInstanceOf(DomainError);
    await expect(err).rejects.toMatchObject({ code: "sort_order_invalido" });
  });

  it("allows asc and desc sortOrder", async () => {
    const port = new FakeVentasListPort();
    await expect(
      buscarVentas(port, { sortBy: "fecha_venta", sortOrder: "asc" }),
    ).resolves.toBeDefined();
    await expect(
      buscarVentas(port, { sortBy: "fecha_venta", sortOrder: "desc" }),
    ).resolves.toBeDefined();
  });

  it("propagates port errors without wrapping them", async () => {
    const port = new FakeVentasListPort();
    const e = new DomainError("network_error", "fallo de red");
    port.throwOnNext = e;
    await expect(buscarVentas(port, {})).rejects.toBe(e);
  });
});
