import { describe, it, expect } from "vitest";
import { dtoToBenchmark } from "./dtoToBenchmark";
import type { BenchmarkDto, MetricaDto, MetricaMoneyDto } from "../http/dtos";

function buildMetricaDto(overrides: Partial<MetricaDto> = {}): MetricaDto {
  return {
    aplica: true,
    valor: 87.5,
    percentil: 72,
    mediana: 80.0,
    p25: 60,
    p75: 95,
    n: 138,
    muestra_pequena: false,
    ...overrides,
  };
}

function buildMetricaMoneyDto(
  overrides: Partial<MetricaMoneyDto> = {},
): MetricaMoneyDto {
  return {
    aplica: true,
    valor: "12450.00",
    percentil: 64,
    mediana: "9800.00",
    p25: "5200.00",
    p75: "18900.00",
    n: 140,
    muestra_pequena: false,
    ...overrides,
  };
}

function buildValidDto(overrides: Partial<BenchmarkDto> = {}): BenchmarkDto {
  return {
    disponible: true,
    cohort_by: "zona",
    zona: "NORTE",
    n: 142,
    puntualidad: buildMetricaDto(),
    clv: buildMetricaMoneyDto(),
    credito: buildMetricaDto({ valor: 78, percentil: 55, mediana: 75, p25: 60, p75: 88, n: 96 }),
    recompra: buildMetricaDto({ valor: 64, percentil: 48, mediana: 66, p25: 50, p75: 80, n: 140 }),
    ...overrides,
  };
}

describe("dtoToBenchmark", () => {
  it("maps top-level disponible, cohortBy, zona, n", () => {
    const b = dtoToBenchmark(buildValidDto());
    expect(b.disponible).toBe(true);
    expect(b.cohortBy).toBe("zona");
    expect(b.zona).toBe("NORTE");
    expect(b.n).toBe(142);
  });

  it("maps disponible:false", () => {
    const b = dtoToBenchmark(buildValidDto({ disponible: false }));
    expect(b.disponible).toBe(false);
  });

  it("maps cohort_by to camelCase cohortBy", () => {
    const b = dtoToBenchmark(buildValidDto({ cohort_by: "segmento" }));
    expect(b.cohortBy).toBe("segmento");
  });

  it("maps puntualidad as numeric metrica", () => {
    const b = dtoToBenchmark(buildValidDto());
    expect(b.puntualidad.aplica).toBe(true);
    expect(b.puntualidad.valor).toBe(87.5);
    expect(b.puntualidad.percentil).toBe(72);
    expect(b.puntualidad.mediana).toBe(80.0);
    expect(b.puntualidad.p25).toBe(60);
    expect(b.puntualidad.p75).toBe(95);
    expect(b.puntualidad.n).toBe(138);
    expect(b.puntualidad.muestraPequena).toBe(false);
  });

  it("maps muestra_pequena to muestraPequena", () => {
    const dto = buildValidDto({
      puntualidad: buildMetricaDto({ muestra_pequena: true, percentil: 0 }),
    });
    expect(dtoToBenchmark(dto).puntualidad.muestraPequena).toBe(true);
  });

  it("parses clv money strings to numbers", () => {
    const b = dtoToBenchmark(buildValidDto());
    expect(b.clv.valor).toBe(12450);
    expect(b.clv.mediana).toBe(9800);
    expect(b.clv.p25).toBe(5200);
    expect(b.clv.p75).toBe(18900);
  });

  it("clv fields are numbers not strings", () => {
    const b = dtoToBenchmark(buildValidDto());
    expect(typeof b.clv.valor).toBe("number");
    expect(typeof b.clv.mediana).toBe("number");
  });

  it("maps credito numeric fields", () => {
    const b = dtoToBenchmark(buildValidDto());
    expect(b.credito.valor).toBe(78);
    expect(b.credito.percentil).toBe(55);
    expect(b.credito.mediana).toBe(75);
  });

  it("maps recompra numeric fields", () => {
    const b = dtoToBenchmark(buildValidDto());
    expect(b.recompra.valor).toBe(64);
    expect(b.recompra.percentil).toBe(48);
  });

  it("handles aplica:false", () => {
    const dto = buildValidDto({
      credito: buildMetricaDto({ aplica: false, valor: 0, percentil: 0 }),
    });
    expect(dtoToBenchmark(dto).credito.aplica).toBe(false);
  });

  it("handles clv aplica:false with zero strings", () => {
    const dto = buildValidDto({
      clv: buildMetricaMoneyDto({
        aplica: false,
        valor: "0.00",
        mediana: "0.00",
        p25: "0.00",
        p75: "0.00",
        percentil: 0,
      }),
    });
    const b = dtoToBenchmark(dto);
    expect(b.clv.aplica).toBe(false);
    expect(b.clv.valor).toBe(0);
  });
});
