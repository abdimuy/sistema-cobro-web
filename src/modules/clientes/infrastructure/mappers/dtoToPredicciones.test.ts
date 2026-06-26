import { describe, it, expect } from "vitest";
import { dtoToPredicciones } from "./dtoToPredicciones";
import type { PrediccionesDto } from "../http/dtos";

function buildValidDto(overrides: Partial<PrediccionesDto> = {}): PrediccionesDto {
  return {
    disponible: true,
    p_alive: { punto: 0.82, lo: 0.61, hi: 0.95 },
    compras_esperadas_12m: { punto: 3.4, lo: 1.8, hi: 5.1 },
    clv: { punto: "12450.00", lo: "6200.00", hi: "21800.00" },
    proxima_compra_dias: { punto: 38, lo: 21, hi: 64 },
    draws: 2000,
    ...overrides,
  };
}

describe("dtoToPredicciones", () => {
  it("maps disponible", () => {
    expect(dtoToPredicciones(buildValidDto()).disponible).toBe(true);
    expect(dtoToPredicciones(buildValidDto({ disponible: false })).disponible).toBe(false);
  });

  it("maps p_alive interval as numbers", () => {
    const pred = dtoToPredicciones(buildValidDto());
    expect(pred.pAlive.punto).toBe(0.82);
    expect(pred.pAlive.lo).toBe(0.61);
    expect(pred.pAlive.hi).toBe(0.95);
  });

  it("maps compras_esperadas_12m interval as numbers", () => {
    const pred = dtoToPredicciones(buildValidDto());
    expect(pred.comprasEsperadas12m.punto).toBe(3.4);
    expect(pred.comprasEsperadas12m.lo).toBe(1.8);
    expect(pred.comprasEsperadas12m.hi).toBe(5.1);
  });

  it("parses clv strings to numbers", () => {
    const pred = dtoToPredicciones(buildValidDto());
    expect(pred.clv.punto).toBe(12450);
    expect(pred.clv.lo).toBe(6200);
    expect(pred.clv.hi).toBe(21800);
  });

  it("clv values are numbers (not strings)", () => {
    const pred = dtoToPredicciones(buildValidDto());
    expect(typeof pred.clv.punto).toBe("number");
    expect(typeof pred.clv.lo).toBe("number");
    expect(typeof pred.clv.hi).toBe("number");
  });

  it("maps proxima_compra_dias interval as numbers", () => {
    const pred = dtoToPredicciones(buildValidDto());
    expect(pred.proximaCompraDias.punto).toBe(38);
    expect(pred.proximaCompraDias.lo).toBe(21);
    expect(pred.proximaCompraDias.hi).toBe(64);
  });

  it("maps draws", () => {
    const pred = dtoToPredicciones(buildValidDto());
    expect(pred.draws).toBe(2000);
  });

  it("handles disponible:false with zero intervals", () => {
    const dto = buildValidDto({
      disponible: false,
      p_alive: { punto: 0, lo: 0, hi: 0 },
      compras_esperadas_12m: { punto: 0, lo: 0, hi: 0 },
      clv: { punto: "0.00", lo: "0.00", hi: "0.00" },
      proxima_compra_dias: { punto: 0, lo: 0, hi: 0 },
      draws: 0,
    });
    const pred = dtoToPredicciones(dto);
    expect(pred.disponible).toBe(false);
    expect(pred.pAlive.punto).toBe(0);
    expect(pred.clv.punto).toBe(0);
  });
});
