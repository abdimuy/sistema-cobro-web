import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { groupByMonth, computeMaxMonto, cellClass, weekMs, isCurrentWeek } from "./heatmapHelpers";
import type { SemanaRitmo } from "../../../domain/entities/RitmoPago";

function makeSemana(semanaInicio: Date, montoAbonado = "0.00", saldo = "0.00"): SemanaRitmo {
  return { semanaInicio, montoAbonado, saldo, numPagos: 0, pagos: [] };
}

describe("weekMs", () => {
  it("adds exactly 7 days in milliseconds", () => {
    const d = new Date("2026-01-05T00:00:00.000Z");
    const expected = d.getTime() + 7 * 24 * 60 * 60 * 1000;
    expect(weekMs(d)).toBe(expected);
  });

  it("returns a value 7 days ahead", () => {
    const d = new Date("2026-06-01T00:00:00.000Z");
    const next = new Date(weekMs(d));
    expect(next.toISOString()).toBe("2026-06-08T00:00:00.000Z");
  });
});

describe("isCurrentWeek", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when now is exactly at semanaInicio", () => {
    const start = new Date("2026-06-15T00:00:00.000Z");
    vi.setSystemTime(start);
    const semana = makeSemana(start);
    expect(isCurrentWeek(semana)).toBe(true);
  });

  it("returns true when now is in the middle of the week", () => {
    const start = new Date("2026-06-15T00:00:00.000Z");
    vi.setSystemTime(new Date("2026-06-18T12:00:00.000Z"));
    const semana = makeSemana(start);
    expect(isCurrentWeek(semana)).toBe(true);
  });

  it("returns false when now is exactly at the end of the week (exclusive)", () => {
    const start = new Date("2026-06-15T00:00:00.000Z");
    vi.setSystemTime(new Date("2026-06-22T00:00:00.000Z")); // exactly 7 days later
    const semana = makeSemana(start);
    expect(isCurrentWeek(semana)).toBe(false);
  });

  it("returns false when now is before semanaInicio", () => {
    const start = new Date("2026-06-15T00:00:00.000Z");
    vi.setSystemTime(new Date("2026-06-14T23:59:59.000Z"));
    const semana = makeSemana(start);
    expect(isCurrentWeek(semana)).toBe(false);
  });
});

describe("groupByMonth", () => {
  it("groups semanas from the same month together", () => {
    const semanas = [
      makeSemana(new Date("2026-05-04T00:00:00.000Z")),
      makeSemana(new Date("2026-05-11T00:00:00.000Z")),
      makeSemana(new Date("2026-05-18T00:00:00.000Z")),
    ];
    const groups = groupByMonth(semanas);
    expect(groups).toHaveLength(1);
    expect(groups[0].semanas).toHaveLength(3);
    expect(groups[0].label).toBe("may 2026");
  });

  it("splits semanas across two months into two groups", () => {
    const semanas = [
      makeSemana(new Date("2026-05-25T12:00:00.000Z")),
      makeSemana(new Date("2026-06-08T12:00:00.000Z")),
      makeSemana(new Date("2026-06-15T12:00:00.000Z")),
    ];
    const groups = groupByMonth(semanas);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe("may 2026");
    expect(groups[1].label).toBe("jun 2026");
    expect(groups[1].semanas).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it("preserves order of months", () => {
    const semanas = [
      makeSemana(new Date("2026-01-05T00:00:00.000Z")),
      makeSemana(new Date("2026-03-02T00:00:00.000Z")),
      makeSemana(new Date("2026-02-02T00:00:00.000Z")),
    ];
    // Order follows insertion order (Map preserves insertion order)
    const groups = groupByMonth(semanas);
    expect(groups[0].label).toBe("ene 2026");
    expect(groups[1].label).toBe("mar 2026");
    expect(groups[2].label).toBe("feb 2026");
  });
});

describe("computeMaxMonto", () => {
  it("returns 0 for empty array", () => {
    expect(computeMaxMonto([])).toBe(0);
  });

  it("returns max montoAbonado", () => {
    const semanas = [
      makeSemana(new Date(), "1200.00"),
      makeSemana(new Date(), "850.00"),
      makeSemana(new Date(), "1500.00"),
      makeSemana(new Date(), "0.00"),
    ];
    expect(computeMaxMonto(semanas)).toBe(1500);
  });

  it("returns 0 when all semanas have monto 0", () => {
    const semanas = [makeSemana(new Date(), "0.00"), makeSemana(new Date(), "0.00")];
    expect(computeMaxMonto(semanas)).toBe(0);
  });
});

describe("cellClass", () => {
  it("returns bg-muted when monto is 0", () => {
    expect(cellClass(0, 1000)).toBe("bg-muted");
  });

  it("returns bg-muted when maxMonto is 0", () => {
    expect(cellClass(500, 0)).toBe("bg-muted");
  });

  it("returns lightest green when monto <= 25% of max", () => {
    expect(cellClass(200, 1000)).toContain("hsl(140,45%,78%)");
  });

  it("returns second green when monto <= 50% of max", () => {
    expect(cellClass(400, 1000)).toContain("hsl(143,50%,57%)");
  });

  it("returns third green when monto <= 75% of max", () => {
    expect(cellClass(600, 1000)).toContain("hsl(146,62%,38%)");
  });

  it("returns darkest green when monto > 75% of max", () => {
    expect(cellClass(800, 1000)).toContain("hsl(150,78%,24%)");
  });

  it("returns darkest green when monto equals max", () => {
    expect(cellClass(1000, 1000)).toContain("hsl(150,78%,24%)");
  });
});
