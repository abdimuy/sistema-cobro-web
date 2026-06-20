import { describe, it, expect } from "vitest";
import { dtoToRitmoPago } from "./dtoToRitmoPago";
import type { RitmoPagoDTO, PagoRitmoDTO } from "../http/dtos";

function makePagoRitmoDTO(overrides: Partial<PagoRitmoDTO> = {}): PagoRitmoDTO {
  return {
    docto_cc_id: 70100,
    fecha: "2026-05-06T10:30:00Z",
    hora: "10:30:00",
    importe: "1500.00",
    concepto_cc_id: 87327,
    concepto: "Cobranza en ruta",
    categoria: "pago",
    es_ingreso: true,
    docto_pv_id: 30022,
    folio: "AB0001775",
    ...overrides,
  };
}

function buildValidDTO(overrides: Partial<RitmoPagoDTO> = {}): RitmoPagoDTO {
  return {
    ancla_dia_ruta: "martes",
    semanas: [
      {
        semana_inicio: "2026-05-05T00:00:00Z",
        monto_abonado: "1500.00",
        saldo: "8000.00",
        num_pagos: 2,
        pagos: [
          makePagoRitmoDTO({ docto_cc_id: 70100, importe: "750.00" }),
          makePagoRitmoDTO({ docto_cc_id: 70101, importe: "750.00", folio: "AB0001776" }),
        ],
      },
      {
        semana_inicio: "2026-05-12T00:00:00Z",
        monto_abonado: "0.00",
        saldo: "8000.00",
        num_pagos: 0,
        pagos: [],
      },
    ],
    eventos: [
      {
        fecha: "2026-03-15T00:00:00Z",
        tipo: "venta_credito",
        monto: "9500.00",
        docto_pv_id: 30022,
        folio: "CV-00590",
        plazo_meses: 6,
      },
      {
        fecha: "2026-04-20T00:00:00Z",
        tipo: "venta_contado",
        monto: "3200.00",
        docto_pv_id: 30040,
        folio: "C-00615",
        plazo_meses: 0,
      },
      {
        fecha: "2026-05-10T00:00:00Z",
        tipo: "liquidacion",
        monto: "0.00",
        docto_pv_id: 30022,
        folio: "CV-00590",
        plazo_meses: 0,
      },
    ],
    resumen: {
      total_abonado: "4700.00",
      semanas_con_pago: 1,
      semanas_activas: 2,
      racha_actual_sem: 0,
      constancia_pct: "50.00",
      saldo_actual: "8000.00",
    },
    ...overrides,
  };
}

describe("dtoToRitmoPago", () => {
  it("maps ancla_dia_ruta to anclaDiaRuta", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(ritmo.anclaDiaRuta).toBe("martes");
  });

  it("maps semanas array with Date and string fields", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(ritmo.semanas).toHaveLength(2);
    expect(ritmo.semanas[0].semanaInicio).toBeInstanceOf(Date);
    expect(ritmo.semanas[0].semanaInicio.getTime()).toBe(
      new Date("2026-05-05T00:00:00Z").getTime(),
    );
    expect(ritmo.semanas[0].montoAbonado).toBe("1500.00");
    expect(ritmo.semanas[0].saldo).toBe("8000.00");
    expect(ritmo.semanas[0].numPagos).toBe(2);
  });

  it("maps pagos array — doctoCcId, importe and folio flow through", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(ritmo.semanas[0].pagos).toHaveLength(2);
    expect(ritmo.semanas[0].pagos[0].doctoCcId).toBe(70100);
    expect(ritmo.semanas[0].pagos[1].doctoCcId).toBe(70101);
    expect(ritmo.semanas[0].pagos[0].importe).toBe("750.00");
    expect(ritmo.semanas[0].pagos[1].folio).toBe("AB0001776");
  });

  it("maps pago.fecha as Date instance from RFC3339", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    const pago = ritmo.semanas[0].pagos[0];
    expect(pago.fecha).toBeInstanceOf(Date);
    expect(pago.fecha.getTime()).toBe(new Date("2026-05-06T10:30:00Z").getTime());
  });

  it("maps pago.hora as display string (HH:MM:SS)", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(ritmo.semanas[0].pagos[0].hora).toBe("10:30:00");
  });

  it("maps pago.categoria via toCategoriaPago", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(ritmo.semanas[0].pagos[0].categoria).toBe("pago");
  });

  it("maps unknown categoria to 'otro' (toCategoriaPago fallback)", () => {
    const dto = buildValidDTO();
    dto.semanas[0].pagos[0] = { ...dto.semanas[0].pagos[0], categoria: "categoria_desconocida" };
    const ritmo = dtoToRitmoPago(dto);
    expect(ritmo.semanas[0].pagos[0].categoria).toBe("otro");
  });

  it("maps pago identity fields (concepto, conceptoCcId, esIngreso, doctoPvId)", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    const pago = ritmo.semanas[0].pagos[0];
    expect(pago.concepto).toBe("Cobranza en ruta");
    expect(pago.conceptoCcId).toBe(87327);
    expect(pago.esIngreso).toBe(true);
    expect(pago.doctoPvId).toBe(30022);
  });

  it("defaults pagos to [] when pagos field is absent from DTO semana", () => {
    const dto = buildValidDTO();
    // Simulate old API response without pagos field
    const semanaWithoutPagos = { ...dto.semanas[0] } as Partial<typeof dto.semanas[0]>;
    delete semanaWithoutPagos.pagos;
    const dtoWithMissing = {
      ...dto,
      semanas: [semanaWithoutPagos as typeof dto.semanas[0], dto.semanas[1]],
    };
    const ritmo = dtoToRitmoPago(dtoWithMissing);
    expect(ritmo.semanas[0].pagos).toEqual([]);
  });

  it("empty semana has pagos = []", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(ritmo.semanas[1].pagos).toEqual([]);
  });

  it("semana montoAbonado and saldo remain as strings (not numbers)", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(typeof ritmo.semanas[0].montoAbonado).toBe("string");
    expect(typeof ritmo.semanas[0].saldo).toBe("string");
  });

  it("maps eventos array: all three tipos", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(ritmo.eventos).toHaveLength(3);
    expect(ritmo.eventos[0].tipo).toBe("venta_credito");
    expect(ritmo.eventos[1].tipo).toBe("venta_contado");
    expect(ritmo.eventos[2].tipo).toBe("liquidacion");
  });

  it("maps evento fecha as Date instance", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(ritmo.eventos[0].fecha).toBeInstanceOf(Date);
    expect(ritmo.eventos[0].fecha.getTime()).toBe(
      new Date("2026-03-15T00:00:00Z").getTime(),
    );
  });

  it("evento monto remains as string", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(typeof ritmo.eventos[0].monto).toBe("string");
    expect(ritmo.eventos[0].monto).toBe("9500.00");
  });

  it("maps evento identity fields", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    const ev = ritmo.eventos[0];
    expect(ev.doctoPvId).toBe(30022);
    expect(ev.folio).toBe("CV-00590");
    expect(ev.plazoMeses).toBe(6);
  });

  it("maps resumen all fields correctly", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(ritmo.resumen.totalAbonado).toBe("4700.00");
    expect(ritmo.resumen.semanasConPago).toBe(1);
    expect(ritmo.resumen.semanasActivas).toBe(2);
    expect(ritmo.resumen.rachaActualSem).toBe(0);
    expect(ritmo.resumen.constanciaPct).toBe("50.00");
    expect(ritmo.resumen.saldoActual).toBe("8000.00");
  });

  it("resumen decimal fields remain as strings", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO());
    expect(typeof ritmo.resumen.totalAbonado).toBe("string");
    expect(typeof ritmo.resumen.constanciaPct).toBe("string");
    expect(typeof ritmo.resumen.saldoActual).toBe("string");
  });

  it("accepts empty semanas and eventos arrays", () => {
    const ritmo = dtoToRitmoPago(buildValidDTO({ semanas: [], eventos: [] }));
    expect(ritmo.semanas).toHaveLength(0);
    expect(ritmo.eventos).toHaveLength(0);
  });

  it("throws DomainError on invalid evento tipo", () => {
    const dto = buildValidDTO();
    dto.eventos[0] = { ...dto.eventos[0], tipo: "tipo_ficticio" };
    expect(() => dtoToRitmoPago(dto)).toThrowError(
      expect.objectContaining({ code: "evento_tipo_invalido" }),
    );
  });

  it("throws DomainError when semana_inicio is invalid date string", () => {
    const dto = buildValidDTO();
    dto.semanas[0] = { ...dto.semanas[0], semana_inicio: "no-es-fecha" };
    expect(() => dtoToRitmoPago(dto)).toThrowError(
      expect.objectContaining({ code: "semana_inicio_invalida" }),
    );
  });

  it("throws DomainError when semana_inicio is empty string", () => {
    const dto = buildValidDTO();
    dto.semanas[0] = { ...dto.semanas[0], semana_inicio: "" };
    expect(() => dtoToRitmoPago(dto)).toThrowError(
      expect.objectContaining({ code: "semana_inicio_invalida" }),
    );
  });

  it("throws DomainError when evento fecha is invalid date string", () => {
    const dto = buildValidDTO();
    dto.eventos[0] = { ...dto.eventos[0], fecha: "no-es-fecha" };
    expect(() => dtoToRitmoPago(dto)).toThrowError(
      expect.objectContaining({ code: "evento_fecha_invalida" }),
    );
  });

  it("throws DomainError when evento fecha is empty string", () => {
    const dto = buildValidDTO();
    dto.eventos[0] = { ...dto.eventos[0], fecha: "" };
    expect(() => dtoToRitmoPago(dto)).toThrowError(
      expect.objectContaining({ code: "evento_fecha_invalida" }),
    );
  });

  it("throws DomainError when pago.fecha is invalid date string", () => {
    const dto = buildValidDTO();
    dto.semanas[0].pagos[0] = { ...dto.semanas[0].pagos[0], fecha: "no-es-fecha" };
    expect(() => dtoToRitmoPago(dto)).toThrowError(
      expect.objectContaining({ code: "pago_fecha_invalida" }),
    );
  });
});
