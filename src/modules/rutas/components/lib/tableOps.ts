import type { VentaCobranza } from "../../domain/entities/VentaCobranza";

export type SortKey =
  | "clienteNombre"
  | "atrasoAntesCuotas"
  | "pagoCuotas"
  | "aporte"
  | "atrasoDespuesCuotas";

export type SortDir = "asc" | "desc";

/** Filter ventas by clienteNombre or folio (substring, case-insensitive). */
export function filterVentas(ventas: ReadonlyArray<VentaCobranza>, query: string): VentaCobranza[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...ventas];
  return ventas.filter(
    (v) =>
      v.clienteNombre.toLowerCase().includes(q) ||
      v.folio.toLowerCase().includes(q),
  );
}

/** Sort ventas by key. Numeric for cuota columns; alphabetic for clienteNombre. */
export function sortVentas(
  ventas: ReadonlyArray<VentaCobranza>,
  key: SortKey | null,
  dir: SortDir,
): VentaCobranza[] {
  if (!key) return [...ventas];
  return [...ventas].sort((a, b) => {
    let cmp: number;
    if (key === "clienteNombre") {
      cmp = a.clienteNombre.localeCompare(b.clienteNombre, "es");
    } else {
      cmp = Number(a[key]) - Number(b[key]);
    }
    return dir === "asc" ? cmp : -cmp;
  });
}
