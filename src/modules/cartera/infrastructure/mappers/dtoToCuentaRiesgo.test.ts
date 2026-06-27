import { describe, it, expect } from "vitest";
import { dtoToCuentaRiesgo } from "./dtoToCuentaRiesgo";
import { DomainError } from "../../domain/errors";
import type { CuentaRiesgoDTO } from "../http/dtos";

function makeDto(overrides: Partial<CuentaRiesgoDTO> = {}): CuentaRiesgoDTO {
  return {
    cliente_id: 1001,
    nombre: "MUEBLES HERNANDEZ SA",
    zona: "ZONA_NORTE",
    tier_riesgo: "alto",
    segmento: "DORMIDO_VALIOSO",
    estado_pago: "EN_MORA",
    saldo: "15000.00",
    dias_atraso_prom: 45,
    pct_pagos_a_tiempo: "0.60",
    cadencia_dias: 30,
    fecha_ultimo_pago: "2025-10-01T00:00:00Z",
    fecha_prox_pago: "2025-11-01T00:00:00Z",
    ...overrides,
  };
}

describe("dtoToCuentaRiesgo", () => {
  it("maps all fields correctly with valid dates", () => {
    const entity = dtoToCuentaRiesgo(makeDto());
    expect(entity.clienteId).toBe(1001);
    expect(entity.nombre).toBe("MUEBLES HERNANDEZ SA");
    expect(entity.zona).toBe("ZONA_NORTE");
    expect(entity.tierRiesgo).toBe("alto");
    expect(entity.segmento).toBe("DORMIDO_VALIOSO");
    expect(entity.estadoPago).toBe("EN_MORA");
    expect(entity.saldo).toBe("15000.00");
    expect(entity.diasAtrasoProm).toBe(45);
    expect(entity.pctPagosATiempo).toBe("0.60");
    expect(entity.cadenciaDias).toBe(30);
    expect(entity.fechaUltimoPago).toBeInstanceOf(Date);
    expect(entity.fechaProxPago).toBeInstanceOf(Date);
  });

  it("returns null for empty fecha_ultimo_pago", () => {
    const entity = dtoToCuentaRiesgo(makeDto({ fecha_ultimo_pago: "" }));
    expect(entity.fechaUltimoPago).toBeNull();
  });

  it("returns null for empty fecha_prox_pago", () => {
    const entity = dtoToCuentaRiesgo(makeDto({ fecha_prox_pago: "" }));
    expect(entity.fechaProxPago).toBeNull();
  });

  it("throws DomainError for invalid fecha_ultimo_pago", () => {
    expect(() =>
      dtoToCuentaRiesgo(makeDto({ fecha_ultimo_pago: "not-a-date" })),
    ).toThrow(DomainError);
  });

  it("throws DomainError for invalid fecha_prox_pago", () => {
    expect(() =>
      dtoToCuentaRiesgo(makeDto({ fecha_prox_pago: "not-a-date" })),
    ).toThrow(DomainError);
  });
});
