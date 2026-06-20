import { describe, it, expect } from "vitest";
import { dtoToVentaCliente } from "./dtoToVentaCliente";
import type { VentaListItemDTO } from "../http/dtos";

function buildValidDTO(overrides: Partial<VentaListItemDTO> = {}): VentaListItemDTO {
  return {
    docto_pv_id: 55001,
    fecha: "2025-04-10T08:30:00Z",
    folio: "PV-00842",
    tipo: "CREDITO",
    total: "18500.00",
    saldo_venta: "9200.00",
    num_pagos: 8,
    hora: "14:32:00",
    almacen: "Camioneta Nissan — Jueves",
    primer_articulo: "Colchón Restonic Ghana Matrimonial",
    num_articulos: 3,
    ...overrides,
  };
}

describe("dtoToVentaCliente", () => {
  it("happy path: maps all fields correctly", () => {
    const dto = buildValidDTO();
    const venta = dtoToVentaCliente(dto);

    expect(venta.doctoPvId).toBe(55001);
    expect(venta.fecha).toBeInstanceOf(Date);
    expect(venta.fecha.getTime()).toBe(new Date("2025-04-10T08:30:00Z").getTime());
    expect(venta.folio).toBe("PV-00842");
    expect(venta.tipo).toBe("CREDITO");
    expect(venta.total).toBe("18500.00");
    expect(venta.saldoVenta).toBe("9200.00");
    expect(venta.numPagos).toBe(8);
  });

  it("maps tipo CONTADO correctly", () => {
    const venta = dtoToVentaCliente(buildValidDTO({ tipo: "CONTADO" }));
    expect(venta.tipo).toBe("CONTADO");
  });

  it("total and saldoVenta are kept as decimal strings", () => {
    const venta = dtoToVentaCliente(buildValidDTO());
    expect(typeof venta.total).toBe("string");
    expect(typeof venta.saldoVenta).toBe("string");
  });

  it("maps a cash sale with zero saldo_venta", () => {
    const dto = buildValidDTO({ tipo: "CONTADO", saldo_venta: "0.00", num_pagos: 1 });
    const venta = dtoToVentaCliente(dto);
    expect(venta.tipo).toBe("CONTADO");
    expect(venta.saldoVenta).toBe("0.00");
  });

  it("throws DomainError with code tipo_venta_invalido on unknown tipo", () => {
    const dto = buildValidDTO({ tipo: "BARTER" });
    expect(() => dtoToVentaCliente(dto)).toThrowError(
      expect.objectContaining({ code: "tipo_venta_invalido" }),
    );
  });

  it("throws DomainError with code fecha_venta_invalida on invalid fecha", () => {
    const dto = buildValidDTO({ fecha: "not-a-date" });
    expect(() => dtoToVentaCliente(dto)).toThrowError(
      expect.objectContaining({ code: "fecha_venta_invalida" }),
    );
  });

  it("maps enriched fields: hora, almacen, primerArticulo, numArticulos", () => {
    const dto = buildValidDTO({
      hora: "18:06:49",
      almacen: "Tienda de Exhibición",
      primer_articulo: "Sala Imperial 3-2-1",
      num_articulos: 2,
    });
    const venta = dtoToVentaCliente(dto);
    expect(venta.hora).toBe("18:06:49");
    expect(venta.almacen).toBe("Tienda de Exhibición");
    expect(venta.primerArticulo).toBe("Sala Imperial 3-2-1");
    expect(venta.numArticulos).toBe(2);
  });

  it("hora is kept as a plain string, not parsed as a Date", () => {
    const dto = buildValidDTO({ hora: "08:00:00" });
    const venta = dtoToVentaCliente(dto);
    expect(typeof venta.hora).toBe("string");
    expect(venta.hora).not.toBeInstanceOf(Date);
  });

  it("maps empty primer_articulo when no articles", () => {
    const dto = buildValidDTO({ primer_articulo: "", num_articulos: 0 });
    const venta = dtoToVentaCliente(dto);
    expect(venta.primerArticulo).toBe("");
    expect(venta.numArticulos).toBe(0);
  });
});
