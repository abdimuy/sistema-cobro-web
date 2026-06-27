import { describe, it, expect } from "vitest";
import { dtoToRollRate } from "./dtoToRollRate";
import { DomainError } from "../../domain/errors";
import type { RollRateDTO } from "../http/dtos";

describe("dtoToRollRate", () => {
  it("maps all fields correctly when disponible=true with valid dates", () => {
    const dto: RollRateDTO = {
      disponible: true,
      roll_rate: 0.12,
      fecha_corte_anterior: "2025-09-30T00:00:00Z",
      fecha_corte_reciente: "2025-10-31T00:00:00Z",
    };
    const entity = dtoToRollRate(dto);
    expect(entity.disponible).toBe(true);
    expect(entity.rollRate).toBe(0.12);
    expect(entity.fechaCorteAnterior).toBeInstanceOf(Date);
    expect(entity.fechaCorteReciente).toBeInstanceOf(Date);
  });

  it("returns null dates when disponible=false and dates are empty", () => {
    const dto: RollRateDTO = {
      disponible: false,
      roll_rate: 0,
      fecha_corte_anterior: "",
      fecha_corte_reciente: "",
    };
    const entity = dtoToRollRate(dto);
    expect(entity.disponible).toBe(false);
    expect(entity.fechaCorteAnterior).toBeNull();
    expect(entity.fechaCorteReciente).toBeNull();
  });

  it("throws DomainError for invalid fecha_corte_anterior", () => {
    const dto: RollRateDTO = {
      disponible: true,
      roll_rate: 0.05,
      fecha_corte_anterior: "not-a-date",
      fecha_corte_reciente: "2025-10-31T00:00:00Z",
    };
    expect(() => dtoToRollRate(dto)).toThrow(DomainError);
  });

  it("throws DomainError for invalid fecha_corte_reciente", () => {
    const dto: RollRateDTO = {
      disponible: true,
      roll_rate: 0.05,
      fecha_corte_anterior: "2025-09-30T00:00:00Z",
      fecha_corte_reciente: "bad",
    };
    expect(() => dtoToRollRate(dto)).toThrow(DomainError);
  });
});
