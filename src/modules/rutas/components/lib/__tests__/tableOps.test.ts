import { describe, it, expect } from "vitest";
import { filterVentas, sortVentas } from "../tableOps";
import type { VentaCobranza } from "../../../domain/entities/VentaCobranza";

function makeVenta(overrides: Partial<VentaCobranza> = {}): VentaCobranza {
  return {
    ventaId: 1,
    clienteId: 1,
    clienteNombre: "JUAN PÉREZ",
    folio: "A-001",
    doctoPvId: 10,
    parcialidad: "1",
    frecuencia: "SEMANAL",
    abonoSemana: "500.00",
    vencidas: "0",
    aporte: "1.00",
    saldo: "5000.00",
    aplicaPonderado: true,
    atrasoAntesCuotas: "2",
    atrasoAntesPesos: "200.00",
    pagoCuotas: "1",
    atrasoDespuesCuotas: "1",
    atrasoDespuesPesos: "100.00",
    ...overrides,
  };
}

const VENTAS: VentaCobranza[] = [
  makeVenta({ ventaId: 1, clienteNombre: "ANA GÓMEZ", folio: "B-002", atrasoAntesCuotas: "3", aporte: "0.85" }),
  makeVenta({ ventaId: 2, clienteNombre: "CARLOS RUIZ", folio: "C-003", atrasoAntesCuotas: "1", aporte: "1.00" }),
  makeVenta({ ventaId: 3, clienteNombre: "JUAN PÉREZ", folio: "A-001", atrasoAntesCuotas: "5", aporte: "0.50" }),
];

describe("filterVentas", () => {
  it("empty query returns all", () => {
    expect(filterVentas(VENTAS, "")).toHaveLength(3);
  });
  it("filters by nombre (case-insensitive)", () => {
    const r = filterVentas(VENTAS, "ana");
    expect(r).toHaveLength(1);
    expect(r[0].clienteNombre).toBe("ANA GÓMEZ");
  });
  it("filters by folio", () => {
    const r = filterVentas(VENTAS, "B-002");
    expect(r).toHaveLength(1);
    expect(r[0].folio).toBe("B-002");
  });
  it("no match returns empty array", () => {
    expect(filterVentas(VENTAS, "zzz")).toHaveLength(0);
  });
});

describe("sortVentas", () => {
  it("null key returns original order", () => {
    const r = sortVentas(VENTAS, null, "asc");
    expect(r.map((v) => v.ventaId)).toEqual([1, 2, 3]);
  });
  it("sorts by clienteNombre asc", () => {
    const r = sortVentas(VENTAS, "clienteNombre", "asc");
    expect(r[0].clienteNombre).toBe("ANA GÓMEZ");
    expect(r[2].clienteNombre).toBe("JUAN PÉREZ");
  });
  it("sorts by clienteNombre desc", () => {
    const r = sortVentas(VENTAS, "clienteNombre", "desc");
    expect(r[0].clienteNombre).toBe("JUAN PÉREZ");
  });
  it("sorts by atrasoAntesCuotas asc", () => {
    const r = sortVentas(VENTAS, "atrasoAntesCuotas", "asc");
    expect(r[0].atrasoAntesCuotas).toBe("1");
    expect(r[2].atrasoAntesCuotas).toBe("5");
  });
  it("sorts by aporte desc", () => {
    const r = sortVentas(VENTAS, "aporte", "desc");
    expect(r[0].aporte).toBe("1.00");
  });
  it("does not mutate original array", () => {
    const original = [...VENTAS];
    sortVentas(VENTAS, "clienteNombre", "asc");
    expect(VENTAS.map((v) => v.ventaId)).toEqual(original.map((v) => v.ventaId));
  });
});
