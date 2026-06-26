import { describe, it, expect } from "vitest";
import { dtoToTimeline } from "./dtoToTimeline";
import type { TimelineDto } from "../http/dtos";

function buildValidDto(overrides: Partial<TimelineDto> = {}): TimelineDto {
  return {
    eventos: [
      { fecha: "2026-05-12T00:00:00Z", tipo: "compra_credito", monto: "8500.00", etiqueta: "A-1234", ref_id: 55012 },
      { fecha: "2026-05-05T00:00:00Z", tipo: "pago", monto: "750.00", etiqueta: "Abono", ref_id: 99021 },
      { fecha: "2026-04-20T00:00:00Z", tipo: "compra_contado", monto: "1200.00", etiqueta: "A-1190", ref_id: 55000 },
    ],
    ...overrides,
  };
}

describe("dtoToTimeline", () => {
  it("maps all 3 event types", () => {
    const result = dtoToTimeline(buildValidDto());
    expect(result).toHaveLength(3);
    expect(result[0].tipo).toBe("compra_credito");
    expect(result[1].tipo).toBe("pago");
    expect(result[2].tipo).toBe("compra_contado");
  });

  it("parses monto string to number", () => {
    const result = dtoToTimeline(buildValidDto());
    expect(result[0].monto).toBe(8500);
    expect(typeof result[0].monto).toBe("number");
  });

  it("maps ref_id to refId", () => {
    const result = dtoToTimeline(buildValidDto());
    expect(result[0].refId).toBe(55012);
    expect(result[1].refId).toBe(99021);
  });

  it("parses fecha to Date instance", () => {
    const result = dtoToTimeline(buildValidDto());
    expect(result[0].fecha).toBeInstanceOf(Date);
    expect(result[0].fecha.toISOString()).toBe("2026-05-12T00:00:00.000Z");
  });

  it("maps etiqueta unchanged", () => {
    const result = dtoToTimeline(buildValidDto());
    expect(result[0].etiqueta).toBe("A-1234");
    expect(result[1].etiqueta).toBe("Abono");
  });

  it("returns [] when eventos is empty", () => {
    expect(dtoToTimeline({ eventos: [] })).toEqual([]);
  });
});
