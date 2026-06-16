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
});
