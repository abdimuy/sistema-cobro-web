import type { VentaDetalle } from "./entities";

export type FilaEstado = "pagada" | "actual" | "pendiente";

export type FilaPlan = {
  indice: number;
  label: string;
  fechaEstimada: Date;
  monto: string;
  estado: FilaEstado;
};

export type ResumenPlan = {
  total: string;
  enganche: string;
  parcialidad: string;
  numCuotas: number;
  pagado: string;
  saldo: string;
  atrasado: boolean;
  cadenciaLabel: string;
};

export type PlanPagos = {
  filas: FilaPlan[];
  resumen: ResumenPlan;
};

const toCents = (s: string): number => Math.round(parseFloat(s) * 100);
const fromCents = (c: number): string => (c / 100).toFixed(2);
const addDays = (d: Date, days: number): Date =>
  new Date(d.getTime() + days * 86_400_000);

/** Derives the day-step and display label from formaDePago (case-insensitive). */
function cadenciaFromFormaDePago(formaDePago: string): { dayStep: number; label: string } {
  const f = formaDePago.toLowerCase();
  if (f.includes("quincen")) return { dayStep: 14, label: "quincenas" };
  if (f.includes("mensual") || f.includes("mes")) return { dayStep: 30, label: "meses" };
  return { dayStep: 7, label: "sem" };
}

/** Returns null for contado sales or when contrato data is missing/invalid. */
export function calcularPlanPagos(
  detalle: VentaDetalle,
  hoy: Date = new Date(),
): PlanPagos | null {
  const { contrato, venta, pagos } = detalle;
  if (contrato === null) return null;

  const parcialidadCents = toCents(contrato.parcialidad);
  const engancheCents = toCents(contrato.enganche);
  const totalCents = toCents(venta.total);

  if (!Number.isFinite(parcialidadCents) || parcialidadCents <= 0) return null;
  if (!Number.isFinite(engancheCents) || !Number.isFinite(totalCents)) return null;

  const restante = totalCents - engancheCents;
  if (restante <= 0) return null;

  const numCuotas = Math.ceil(restante / parcialidadCents);

  const pagadoCents = pagos.reduce(
    (sum, p) => sum + toCents(p.importe),
    0,
  );

  const { dayStep, label: cadenciaLabel } = cadenciaFromFormaDePago(contrato.formaDePago);

  // Build raw filas (without estado yet)
  const rawFilas: Array<{ indice: number; label: string; fechaEstimada: Date; montoCents: number }> = [
    {
      indice: 0,
      label: "Enganche",
      fechaEstimada: venta.fecha,
      montoCents: engancheCents,
    },
  ];

  for (let i = 1; i <= numCuotas; i++) {
    const isLast = i === numCuotas;
    const prevCuotasCents = (i - 1) * parcialidadCents;
    const montoCents = isLast
      ? restante - prevCuotasCents
      : parcialidadCents;
    rawFilas.push({
      indice: i,
      label: `Cuota ${i}`,
      fechaEstimada: addDays(venta.fecha, i * dayStep),
      montoCents,
    });
  }

  // Assign estados via cumulative coverage
  let acumulado = 0;
  let actualAsignado = false;
  const filas: FilaPlan[] = rawFilas.map((f) => {
    let estado: FilaEstado;
    if (acumulado + f.montoCents <= pagadoCents) {
      estado = "pagada";
      acumulado += f.montoCents;
    } else if (!actualAsignado) {
      estado = "actual";
      actualAsignado = true;
    } else {
      estado = "pendiente";
    }
    return {
      indice: f.indice,
      label: f.label,
      fechaEstimada: f.fechaEstimada,
      monto: fromCents(f.montoCents),
      estado,
    };
  });

  // atrasado: any non-pagada fila whose estimated date is in the past
  const hoyTime = hoy.getTime();
  const atrasado = filas.some(
    (f) => f.estado !== "pagada" && f.fechaEstimada.getTime() < hoyTime,
  );

  return {
    filas,
    resumen: {
      total: fromCents(totalCents),
      enganche: fromCents(engancheCents),
      parcialidad: fromCents(parcialidadCents),
      numCuotas,
      pagado: fromCents(pagadoCents),
      saldo: venta.saldoVenta,
      atrasado,
      cadenciaLabel,
    },
  };
}
