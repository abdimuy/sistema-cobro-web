import type { AsignarVendedorSlots } from "../../../presentation/hooks/useAsignarVendedor";
import type { IdentidadMicrosip, VendedorAsignacion } from "../../../domain/entities";

export type Slot = "v1" | "v2" | "v3";

export function slotsFromMapping(vendedor: VendedorAsignacion): AsignarVendedorSlots {
  return {
    l1: vendedor.mapping.v1?.listaId ?? null,
    l2: vendedor.mapping.v2?.listaId ?? null,
    l3: vendedor.mapping.v3?.listaId ?? null,
  };
}

// mappingKeyOf is a derived-value key for the fields that actually
// determine a row/panel's local edit state, so an effect can resync only
// when THIS vendedor's mapping genuinely changed (not merely because the
// list refreshed and produced a new but value-equal object).
export function mappingKeyOf(vendedor: VendedorAsignacion): string {
  return [
    vendedor.mapping.v1?.listaId ?? "-",
    vendedor.mapping.v2?.listaId ?? "-",
    vendedor.mapping.v3?.listaId ?? "-",
    vendedor.estado,
  ].join("|");
}

export function filledCount(slots: AsignarVendedorSlots): number {
  return [slots.l1, slots.l2, slots.l3].filter((v) => v !== null && v !== undefined).length;
}

export function listaIdFor(identidad: IdentidadMicrosip, slot: Slot): number | null {
  if (slot === "v1") return identidad.v1ListaId;
  if (slot === "v2") return identidad.v2ListaId;
  return identidad.v3ListaId;
}

export function slotValue(slots: AsignarVendedorSlots, slot: Slot): number | null {
  if (slot === "v1") return slots.l1 ?? null;
  if (slot === "v2") return slots.l2 ?? null;
  return slots.l3 ?? null;
}

export function withSlot(slots: AsignarVendedorSlots, slot: Slot, listaId: number | null): AsignarVendedorSlots {
  if (slot === "v1") return { ...slots, l1: listaId };
  if (slot === "v2") return { ...slots, l2: listaId };
  return { ...slots, l3: listaId };
}

// nombreForSlot resolves a display name for a slot's current (possibly
// unsaved) listaId: prefer the vendedor's own saved mapping name when the id
// still matches it, otherwise look it up among the loaded opciones (covers
// a freshly picked/overridden id that isn't part of the saved mapping yet).
export function nombreForSlot(
  vendedor: VendedorAsignacion,
  opciones: ReadonlyArray<IdentidadMicrosip>,
  slot: Slot,
  listaId: number | null,
): string | null {
  if (listaId === null) return null;
  const saved = vendedor.mapping[slot];
  if (saved && saved.listaId === listaId) return saved.nombre;
  const found = opciones.find((o) => listaIdFor(o, slot) === listaId);
  return found ? found.nombre : `#${listaId}`;
}

export function nombreResuelto(vendedor: VendedorAsignacion): string | null {
  return vendedor.mapping.v1?.nombre ?? vendedor.mapping.v2?.nombre ?? vendedor.mapping.v3?.nombre ?? null;
}
