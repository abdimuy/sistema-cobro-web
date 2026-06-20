import { describe, it, expect } from "vitest";
import { dtoToVentaDetalle } from "./dtoToVentaDetalle";
import type { VentaDetalleDTO } from "../http/dtos";

function buildValidDTO(overrides: Partial<VentaDetalleDTO> = {}): VentaDetalleDTO {
  return {
    venta: {
      docto_pv_id: 55001,
      cliente_id: 3001,
      fecha: "2025-04-10T08:30:00Z",
      folio: "PV-00842",
      tipo: "CREDITO",
      total: "18500.00",
      saldo_venta: "9200.00",
      num_pagos: 8,
    },
    productos: [
      {
        articulo_id: 1101,
        nombre: "Sofá 3 plazas Cancún",
        unidades: "1.00000",
        precio_unitario: "9800.00",
        precio_total_neto: "9800.00",
        pctje_dscto: "0.00",
      },
      {
        articulo_id: 1202,
        nombre: "Mesa de centro Vigo",
        unidades: "2.00000",
        precio_unitario: "4350.00",
        precio_total_neto: "8700.00",
        pctje_dscto: "0.00",
      },
    ],
    contrato: {
      parcialidad: "1500.00",
      enganche: "3000.00",
      precio_de_contado: "16000.00",
      plazo_meses: 12,
      forma_de_pago: "mensual",
      vendedores: ["Ana Flores", "José Vargas"],
    },
    pagos: [
      {
        docto_cc_id: 88001,
        fecha: "2025-04-10T08:35:00Z",
        importe: "3000.00",
        forma_cobro: "efectivo",
        concepto_cc_id: 87327,
        concepto: "ABONO",
        categoria: "pago",
        cobrador: "Cobrador",
        es_ingreso: true,
      },
      {
        docto_cc_id: 88002,
        fecha: "2025-05-10T10:00:00Z",
        importe: "1500.00",
        forma_cobro: "transferencia",
        concepto_cc_id: 87327,
        concepto: "ABONO",
        categoria: "pago",
        cobrador: "Cobrador",
        es_ingreso: true,
      },
    ],
    ...overrides,
  };
}

describe("dtoToVentaDetalle", () => {
  it("happy path: maps venta header fields correctly", () => {
    const detalle = dtoToVentaDetalle(buildValidDTO());
    const v = detalle.venta;

    expect(v.doctoPvId).toBe(55001);
    expect(v.fecha).toBeInstanceOf(Date);
    expect(v.fecha.getTime()).toBe(new Date("2025-04-10T08:30:00Z").getTime());
    expect(v.folio).toBe("PV-00842");
    expect(v.tipo).toBe("CREDITO");
    expect(v.total).toBe("18500.00");
    expect(v.saldoVenta).toBe("9200.00");
    expect(v.numPagos).toBe(8);
  });

  it("maps productos array correctly, keeping decimal strings", () => {
    const detalle = dtoToVentaDetalle(buildValidDTO());
    expect(detalle.productos).toHaveLength(2);

    const p = detalle.productos[0];
    expect(p.articuloId).toBe(1101);
    expect(p.nombre).toBe("Sofá 3 plazas Cancún");
    expect(p.unidades).toBe("1.00000");
    expect(p.precioUnitario).toBe("9800.00");
    expect(p.precioTotalNeto).toBe("9800.00");
    expect(p.pctjeDscto).toBe("0.00");
  });

  it("maps contrato fields correctly for a credit sale", () => {
    const detalle = dtoToVentaDetalle(buildValidDTO());
    expect(detalle.contrato).not.toBeNull();
    const c = detalle.contrato!;

    expect(c.parcialidad).toBe("1500.00");
    expect(c.enganche).toBe("3000.00");
    expect(c.precioDeContado).toBe("16000.00");
    expect(c.plazoMeses).toBe(12);
    expect(c.formaDePago).toBe("mensual");
    expect(c.vendedores).toEqual(["Ana Flores", "José Vargas"]);
  });

  it("sets contrato to null for cash (contado) sales", () => {
    const dto = buildValidDTO({ contrato: null });
    const detalle = dtoToVentaDetalle(dto);
    expect(detalle.contrato).toBeNull();
  });

  it("sets contrato to null when the API OMITS the field (undefined) — contado/legacy ventas", () => {
    // The API uses omitempty, so cash/old sales arrive with contrato === undefined,
    // not null. The mapper must not throw reading parcialidad off undefined.
    const dto = buildValidDTO({ contrato: undefined });
    expect(() => dtoToVentaDetalle(dto)).not.toThrow();
    expect(dtoToVentaDetalle(dto).contrato).toBeNull();
  });

  it("maps pagos array correctly, with dates as Date instances", () => {
    const detalle = dtoToVentaDetalle(buildValidDTO());
    expect(detalle.pagos).toHaveLength(2);

    const p = detalle.pagos[0];
    expect(p.doctoCcId).toBe(88001);
    expect(p.fecha).toBeInstanceOf(Date);
    expect(p.fecha.getTime()).toBe(new Date("2025-04-10T08:35:00Z").getTime());
    expect(p.importe).toBe("3000.00");
    expect(p.formaCobro).toBe("efectivo");
    // F1a fields
    expect(p.conceptoCcId).toBe(87327);
    expect(p.concepto).toBe("ABONO");
    expect(p.categoria).toBe("pago");
    expect(p.cobrador).toBe("Cobrador");
    expect(p.esIngreso).toBe(true);
  });

  it("importe in pagos is kept as a decimal string", () => {
    const detalle = dtoToVentaDetalle(buildValidDTO());
    detalle.pagos.forEach((p) => expect(typeof p.importe).toBe("string"));
  });

  it("maps an empty pagos array", () => {
    const dto = buildValidDTO({ pagos: [] });
    const detalle = dtoToVentaDetalle(dto);
    expect(detalle.pagos).toHaveLength(0);
  });

  it("maps venta tipo CONTADO correctly", () => {
    const dto = buildValidDTO();
    dto.venta.tipo = "CONTADO";
    const detalle = dtoToVentaDetalle(dto);
    expect(detalle.venta.tipo).toBe("CONTADO");
  });

  it("throws DomainError with tipo_venta_invalido on invalid tipo", () => {
    const dto = buildValidDTO();
    dto.venta.tipo = "PERMUTA";
    expect(() => dtoToVentaDetalle(dto)).toThrowError(
      expect.objectContaining({ code: "tipo_venta_invalido" }),
    );
  });

  it("throws DomainError with fecha_venta_invalida on invalid venta fecha", () => {
    const dto = buildValidDTO();
    dto.venta.fecha = "no-es-fecha";
    expect(() => dtoToVentaDetalle(dto)).toThrowError(
      expect.objectContaining({ code: "fecha_venta_invalida" }),
    );
  });

  it("throws DomainError with fecha_pago_invalida on invalid pago fecha", () => {
    const dto = buildValidDTO();
    dto.pagos[0].fecha = "fecha-rota";
    expect(() => dtoToVentaDetalle(dto)).toThrowError(
      expect.objectContaining({ code: "fecha_pago_invalida" }),
    );
  });
});
