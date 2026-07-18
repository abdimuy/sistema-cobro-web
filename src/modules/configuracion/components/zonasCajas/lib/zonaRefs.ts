import { SIN_ASIGNAR_ID, type ZonaCajaAsignacion } from "../../../domain/entities";

export type ZonaIds = {
  cajaId: number;
  cajeroId: number;
  vendedorId: number;
  cobradorId: number;
};

export function idsFromZona(zona: ZonaCajaAsignacion): ZonaIds {
  return {
    cajaId: zona.caja?.id ?? SIN_ASIGNAR_ID,
    cajeroId: zona.cajero?.id ?? SIN_ASIGNAR_ID,
    vendedorId: zona.vendedor?.id ?? SIN_ASIGNAR_ID,
    cobradorId: zona.cobrador?.id ?? SIN_ASIGNAR_ID,
  };
}

// refKeyOf is a derived-value key for the fields that actually determine a
// zona row/panel's local edit state, so an effect can resync only when
// THIS zona's refs genuinely changed (not merely because the list
// refreshed and produced a new but value-equal object).
export function refKeyOf(zona: ZonaCajaAsignacion): string {
  return [
    zona.caja?.id ?? "-",
    zona.cajero?.id ?? "-",
    zona.vendedor?.id ?? "-",
    zona.cobrador?.id ?? "-",
  ].join("|");
}

export function filledCount(zona: ZonaCajaAsignacion): number {
  return [zona.caja, zona.cajero, zona.vendedor, zona.cobrador].filter((r) => r !== null).length;
}

export function resumenAsignacion(zona: ZonaCajaAsignacion): string {
  if (filledCount(zona) === 0) return "Sin asignar";
  return [zona.caja?.nombre ?? "—", zona.cajero?.nombre ?? "—", zona.vendedor?.nombre ?? "—", zona.cobrador?.nombre ?? "—"].join(
    " · ",
  );
}

export function idsEqual(a: ZonaIds, b: ZonaIds): boolean {
  return a.cajaId === b.cajaId && a.cajeroId === b.cajeroId && a.vendedorId === b.vendedorId && a.cobradorId === b.cobradorId;
}
