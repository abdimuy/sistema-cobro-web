import type { CobradorPerformance, CuentaRiesgo } from "../../domain/entities";

export type SortDir = "asc" | "desc";
export type CobradorSortKey = "cei" | "par" | "pctCorriente" | "saldoTotal" | "cuentasTotal";
export type CuentaSortKey = "nombre" | "saldo" | "diasAtrasoProm" | "fechaProxPago";

export function sortCobradores(
  rows: readonly CobradorPerformance[],
  key: CobradorSortKey | null,
  dir: SortDir,
): CobradorPerformance[] {
  if (!key) return [...rows];
  return [...rows].sort((a, b) => {
    const cmp = Number(a[key]) - Number(b[key]);
    return dir === "asc" ? cmp : -cmp;
  });
}

export function sortCuentasRiesgo(
  rows: readonly CuentaRiesgo[],
  key: CuentaSortKey | null,
  dir: SortDir,
): CuentaRiesgo[] {
  if (!key) return [...rows];
  return [...rows].sort((a, b) => {
    let cmp: number;
    if (key === "nombre") {
      cmp = a.nombre.localeCompare(b.nombre, "es");
    } else if (key === "fechaProxPago") {
      // nulls sorted last regardless of dir — handle before applying direction
      const aNull = a.fechaProxPago === null;
      const bNull = b.fechaProxPago === null;
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;
      cmp = a.fechaProxPago!.getTime() - b.fechaProxPago!.getTime();
    } else {
      cmp = Number(a[key]) - Number(b[key]);
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

export function filterCuentasPorTier(
  rows: readonly CuentaRiesgo[],
  tier: string | null,
): CuentaRiesgo[] {
  if (!tier) return [...rows];
  return rows.filter((r) => r.tierRiesgo === tier);
}
