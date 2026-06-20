import { describe, it, expect } from "vitest";
import { calcularPlanPagos } from "./planPagos";
import type { VentaDetalle } from "./entities";

// Fixture: CREDITO venta, total=18500, enganche=3700, parcialidad=3200
// restante = 14800, numCuotas = ceil(14800/3200) = 5, última = 14800-4*3200 = 2000
const BASE_FECHA = new Date("2025-11-01T00:00:00.000Z");

function makeDetalle(overrides: Partial<VentaDetalle> = {}): VentaDetalle {
  return {
    venta: {
      doctoPvId: 30015,
      fecha: BASE_FECHA,
      folio: "CV-00542",
      tipo: "CREDITO",
      total: "18500.00",
      saldoVenta: "3200.00",
      numPagos: 5,
      hora: "",
      almacen: "",
      primerArticulo: "",
      numArticulos: 0,
    },
    productos: [],
    contrato: {
      parcialidad: "3200.00",
      enganche: "3700.00",
      precioDeContado: "15000.00",
      plazoMeses: 6,
      formaDePago: "SEMANAL",
      vendedores: [],
    },
    pagos: [],
    ...overrides,
  };
}

describe("calcularPlanPagos", () => {
  it("returns null for contado (contrato=null)", () => {
    const d = makeDetalle({ contrato: null });
    expect(calcularPlanPagos(d)).toBeNull();
  });

  it("returns null when parcialidad is 0", () => {
    const d = makeDetalle({
      contrato: {
        parcialidad: "0.00",
        enganche: "3700.00",
        precioDeContado: "15000.00",
        plazoMeses: 6,
        formaDePago: "SEMANAL",
        vendedores: [],
      },
    });
    expect(calcularPlanPagos(d)).toBeNull();
  });

  it("computes correct numCuotas and last-cuota residuo", () => {
    // total=18500, enganche=3700 → restante=14800, parcialidad=3200
    // numCuotas = ceil(14800/3200) = ceil(4.625) = 5
    // last cuota = 14800 - 4*3200 = 2000
    const plan = calcularPlanPagos(makeDetalle());
    expect(plan).not.toBeNull();
    expect(plan!.resumen.numCuotas).toBe(5);
    const lastFila = plan!.filas[plan!.filas.length - 1];
    expect(lastFila.monto).toBe("2000.00");
  });

  it("all filas have correct count (1 enganche + numCuotas)", () => {
    const plan = calcularPlanPagos(makeDetalle())!;
    expect(plan.filas).toHaveLength(6); // 1 enganche + 5 cuotas
    expect(plan.filas[0].label).toBe("Enganche");
    expect(plan.filas[1].label).toBe("Cuota 1");
    expect(plan.filas[5].label).toBe("Cuota 5");
  });

  it("dates: row 0 = venta.fecha, row 1 = venta.fecha+7d (SEMANAL)", () => {
    const plan = calcularPlanPagos(makeDetalle())!;
    expect(plan.filas[0].fechaEstimada.getTime()).toBe(BASE_FECHA.getTime());
    const expected7d = new Date(BASE_FECHA.getTime() + 7 * 86_400_000);
    expect(plan.filas[1].fechaEstimada.getTime()).toBe(expected7d.getTime());
    expect(plan.resumen.cadenciaLabel).toBe("sem");
  });

  it("cadencia QUINCENAL: cuota 1 = fecha+14d, cuota 2 = fecha+28d, no falso atrasado", () => {
    const d = makeDetalle({
      contrato: {
        parcialidad: "3200.00",
        enganche: "3700.00",
        precioDeContado: "15000.00",
        plazoMeses: 6,
        formaDePago: "QUINCENAL",
        vendedores: [],
      },
    });
    // hoy = one day before venta.fecha so no cuota is overdue
    const pastHoy = new Date(BASE_FECHA.getTime() - 86_400_000);
    const plan = calcularPlanPagos(d, pastHoy)!;
    expect(plan.resumen.cadenciaLabel).toBe("quincenas");
    const expected14d = new Date(BASE_FECHA.getTime() + 14 * 86_400_000);
    expect(plan.filas[1].fechaEstimada.getTime()).toBe(expected14d.getTime());
    const expected28d = new Date(BASE_FECHA.getTime() + 28 * 86_400_000);
    expect(plan.filas[2].fechaEstimada.getTime()).toBe(expected28d.getTime());
    expect(plan.resumen.atrasado).toBe(false);
  });

  it("cadencia MENSUAL: cuota 1 = fecha+30d, no falso atrasado; distingue de SEMANAL", () => {
    const d = makeDetalle({
      contrato: {
        parcialidad: "3200.00",
        enganche: "3700.00",
        precioDeContado: "15000.00",
        plazoMeses: 6,
        formaDePago: "MENSUAL",
        vendedores: [],
      },
    });
    // hoy = one day before venta.fecha so no cuota is overdue
    const pastHoy = new Date(BASE_FECHA.getTime() - 86_400_000);
    const plan = calcularPlanPagos(d, pastHoy)!;
    expect(plan.resumen.cadenciaLabel).toBe("meses");
    const expected30d = new Date(BASE_FECHA.getTime() + 30 * 86_400_000);
    expect(plan.filas[1].fechaEstimada.getTime()).toBe(expected30d.getTime());
    // cuota 1 at +30d is NOT past (hoy is before fecha), so atrasado=false
    expect(plan.resumen.atrasado).toBe(false);
    // Confirm cuota 1 would be WRONGLY marked overdue if weekly (7d) step were used:
    // fecha+7d < fecha-1d is false anyway; more relevant: mensual step != semanal step
    const wrong7d = new Date(BASE_FECHA.getTime() + 7 * 86_400_000);
    expect(plan.filas[1].fechaEstimada.getTime()).not.toBe(wrong7d.getTime());
  });

  it("sin pagos → Enganche=actual, rest=pendiente", () => {
    const plan = calcularPlanPagos(makeDetalle({ pagos: [] }))!;
    expect(plan.filas[0].estado).toBe("actual");
    for (let i = 1; i < plan.filas.length; i++) {
      expect(plan.filas[i].estado).toBe("pendiente");
    }
  });

  it("pagos cubriendo enganche → enganche=pagada, cuota1=actual", () => {
    // pagado = 3700 (exactly covers enganche)
    const d = makeDetalle({
      pagos: [{ doctoCcId: 1, fecha: BASE_FECHA, importe: "3700.00", formaCobro: "EFECTIVO", conceptoCcId: 87327, concepto: "ABONO", categoria: "pago" as const, cobrador: "Cobrador", esIngreso: true }],
    });
    const plan = calcularPlanPagos(d)!;
    expect(plan.filas[0].estado).toBe("pagada");
    expect(plan.filas[1].estado).toBe("actual");
    expect(plan.filas[2].estado).toBe("pendiente");
  });

  it("pagos cubriendo enganche+cuota1 → cuota2=actual", () => {
    // pagado = 3700+3200 = 6900
    const d = makeDetalle({
      pagos: [
        { doctoCcId: 1, fecha: BASE_FECHA, importe: "3700.00", formaCobro: "EFECTIVO", conceptoCcId: 87327, concepto: "ABONO", categoria: "pago" as const, cobrador: "Cobrador", esIngreso: true },
        { doctoCcId: 2, fecha: BASE_FECHA, importe: "3200.00", formaCobro: "EFECTIVO", conceptoCcId: 87327, concepto: "ABONO", categoria: "pago" as const, cobrador: "Cobrador", esIngreso: true },
      ],
    });
    const plan = calcularPlanPagos(d)!;
    expect(plan.filas[0].estado).toBe("pagada");
    expect(plan.filas[1].estado).toBe("pagada");
    expect(plan.filas[2].estado).toBe("actual");
  });

  it("pagos >= total → all pagada, no actual", () => {
    const d = makeDetalle({
      pagos: [{ doctoCcId: 1, fecha: BASE_FECHA, importe: "18500.00", formaCobro: "EFECTIVO", conceptoCcId: 87327, concepto: "ABONO", categoria: "pago" as const, cobrador: "Cobrador", esIngreso: true }],
    });
    const plan = calcularPlanPagos(d)!;
    for (const fila of plan.filas) {
      expect(fila.estado).toBe("pagada");
    }
  });

  it("resumen: pagado = sum of pagos, saldo = venta.saldoVenta", () => {
    const d = makeDetalle({
      pagos: [
        { doctoCcId: 1, fecha: BASE_FECHA, importe: "3200.00", formaCobro: "EFECTIVO", conceptoCcId: 87327, concepto: "ABONO", categoria: "pago" as const, cobrador: "Cobrador", esIngreso: true },
        { doctoCcId: 2, fecha: BASE_FECHA, importe: "3200.00", formaCobro: "EFECTIVO", conceptoCcId: 87327, concepto: "ABONO", categoria: "pago" as const, cobrador: "Cobrador", esIngreso: true },
      ],
    });
    const plan = calcularPlanPagos(d)!;
    expect(plan.resumen.pagado).toBe("6400.00");
    expect(plan.resumen.saldo).toBe("3200.00");
  });

  it("resumen fields match input", () => {
    const plan = calcularPlanPagos(makeDetalle())!;
    expect(plan.resumen.total).toBe("18500.00");
    expect(plan.resumen.enganche).toBe("3700.00");
    expect(plan.resumen.parcialidad).toBe("3200.00");
    expect(plan.resumen.numCuotas).toBe(5);
  });

  it("atrasado=true when non-pagada fila date is in the past", () => {
    // Use a future venta.fecha so row 0 is today, but pass hoy far in the future
    const d = makeDetalle({ pagos: [] });
    const futureHoy = new Date(BASE_FECHA.getTime() + 365 * 86_400_000);
    const plan = calcularPlanPagos(d, futureHoy)!;
    expect(plan.resumen.atrasado).toBe(true);
  });

  it("atrasado=false when all non-pagada filas are in the future", () => {
    // hoy = day before venta.fecha so all dates are in the future
    const d = makeDetalle({ pagos: [] });
    const pastHoy = new Date(BASE_FECHA.getTime() - 86_400_000);
    const plan = calcularPlanPagos(d, pastHoy)!;
    expect(plan.resumen.atrasado).toBe(false);
  });
});
