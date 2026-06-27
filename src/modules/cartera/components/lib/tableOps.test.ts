import { describe, it, expect } from "vitest";
import {
  sortCobradores,
  sortCuentasRiesgo,
  filterCuentasPorTier,
} from "./tableOps";
import type { CobradorPerformance, CuentaRiesgo } from "../../domain/entities";

function makeCobrador(overrides: Partial<CobradorPerformance> = {}): CobradorPerformance {
  return {
    cobradorId: 1,
    zonaClienteId: 10,
    cei: "0.85",
    par: "0.12",
    pctCorriente: "0.88",
    saldoTotal: "100000.00",
    saldoMoroso: "12000.00",
    cuentasTotal: 50,
    importeColectado: "30000.00",
    ...overrides,
  };
}

function makeCuenta(overrides: Partial<CuentaRiesgo> = {}): CuentaRiesgo {
  return {
    clienteId: 1001,
    nombre: "HERNANDEZ GARCIA SA",
    zona: "ZONA_NORTE",
    tierRiesgo: "EN_RIESGO",
    segmento: "DORMIDO_VALIOSO",
    estadoPago: "ATRASADO",
    saldo: "15000.00",
    diasAtrasoProm: 45,
    pctPagosATiempo: "60.00",
    cadenciaDias: 30,
    fechaUltimoPago: new Date("2025-10-01T00:00:00Z"),
    fechaProxPago: new Date("2025-11-01T00:00:00Z"),
    ...overrides,
  };
}

describe("sortCobradores", () => {
  it("sorts by numeric key asc", () => {
    const rows = [
      makeCobrador({ cobradorId: 1, cei: "0.70" }),
      makeCobrador({ cobradorId: 2, cei: "0.90" }),
      makeCobrador({ cobradorId: 3, cei: "0.80" }),
    ];
    const result = sortCobradores(rows, "cei", "asc");
    expect(result.map((r) => r.cobradorId)).toEqual([1, 3, 2]);
  });

  it("sorts by numeric key desc", () => {
    const rows = [
      makeCobrador({ cobradorId: 1, cei: "0.70" }),
      makeCobrador({ cobradorId: 2, cei: "0.90" }),
      makeCobrador({ cobradorId: 3, cei: "0.80" }),
    ];
    const result = sortCobradores(rows, "cei", "desc");
    expect(result.map((r) => r.cobradorId)).toEqual([2, 3, 1]);
  });

  it("returns a copy unchanged when key is null", () => {
    const rows = [
      makeCobrador({ cobradorId: 5 }),
      makeCobrador({ cobradorId: 3 }),
    ];
    const result = sortCobradores(rows, null, "asc");
    expect(result).not.toBe(rows);
    expect(result.map((r) => r.cobradorId)).toEqual([5, 3]);
  });

  it("sorts saldoTotal numerically, not lexicographically", () => {
    // Lexicographic order: "100000.00" < "20000.00" < "9000.00"
    // Numeric order:        9000 < 20000 < 100000
    // This test proves Number()-based sort, not string sort.
    const rows = [
      makeCobrador({ cobradorId: 1, saldoTotal: "9000.00" }),
      makeCobrador({ cobradorId: 2, saldoTotal: "100000.00" }),
      makeCobrador({ cobradorId: 3, saldoTotal: "20000.00" }),
    ];
    const result = sortCobradores(rows, "saldoTotal", "asc");
    expect(result.map((r) => r.cobradorId)).toEqual([1, 3, 2]);
  });
});

describe("sortCuentasRiesgo", () => {
  it("sorts alphabetically by nombre asc", () => {
    const rows = [
      makeCuenta({ clienteId: 1, nombre: "LOPEZ MARTINEZ" }),
      makeCuenta({ clienteId: 2, nombre: "HERNANDEZ GARCIA" }),
      makeCuenta({ clienteId: 3, nombre: "RAMIREZ TORRES" }),
    ];
    const result = sortCuentasRiesgo(rows, "nombre", "asc");
    expect(result.map((r) => r.clienteId)).toEqual([2, 1, 3]);
  });

  it("sorts by saldo desc", () => {
    const rows = [
      makeCuenta({ clienteId: 1, saldo: "5000.00" }),
      makeCuenta({ clienteId: 2, saldo: "20000.00" }),
      makeCuenta({ clienteId: 3, saldo: "12000.00" }),
    ];
    const result = sortCuentasRiesgo(rows, "saldo", "desc");
    expect(result.map((r) => r.clienteId)).toEqual([2, 3, 1]);
  });

  it("returns a copy unchanged when key is null", () => {
    const rows = [
      makeCuenta({ clienteId: 10 }),
      makeCuenta({ clienteId: 20 }),
    ];
    const result = sortCuentasRiesgo(rows, null, "desc");
    expect(result).not.toBe(rows);
    expect(result.map((r) => r.clienteId)).toEqual([10, 20]);
  });

  it("sorts nulls last for fechaProxPago asc", () => {
    const rows = [
      makeCuenta({ clienteId: 1, fechaProxPago: null }),
      makeCuenta({ clienteId: 2, fechaProxPago: new Date("2025-12-01T00:00:00Z") }),
      makeCuenta({ clienteId: 3, fechaProxPago: new Date("2025-11-01T00:00:00Z") }),
    ];
    const result = sortCuentasRiesgo(rows, "fechaProxPago", "asc");
    expect(result.map((r) => r.clienteId)).toEqual([3, 2, 1]);
  });

  it("sorts nulls last for fechaProxPago desc", () => {
    const rows = [
      makeCuenta({ clienteId: 1, fechaProxPago: null }),
      makeCuenta({ clienteId: 2, fechaProxPago: new Date("2025-12-01T00:00:00Z") }),
      makeCuenta({ clienteId: 3, fechaProxPago: new Date("2025-11-01T00:00:00Z") }),
    ];
    const result = sortCuentasRiesgo(rows, "fechaProxPago", "desc");
    expect(result.map((r) => r.clienteId)).toEqual([2, 3, 1]);
  });
});

describe("filterCuentasPorTier", () => {
  it("returns all rows when tier is null", () => {
    const rows = [
      makeCuenta({ clienteId: 1, tierRiesgo: "CRITICO" }),
      makeCuenta({ clienteId: 2, tierRiesgo: "AL_DIA" }),
    ];
    const result = filterCuentasPorTier(rows, null);
    expect(result).toHaveLength(2);
  });

  it("filters by matching tier", () => {
    const rows = [
      makeCuenta({ clienteId: 1, tierRiesgo: "CRITICO", nombre: "GARCIA LOPEZ SA" }),
      makeCuenta({ clienteId: 2, tierRiesgo: "AL_DIA", nombre: "MENDOZA REYES" }),
      makeCuenta({ clienteId: 3, tierRiesgo: "CRITICO", nombre: "PEREZ SALINAS" }),
    ];
    const result = filterCuentasPorTier(rows, "CRITICO");
    expect(result.map((r) => r.clienteId)).toEqual([1, 3]);
  });
});
