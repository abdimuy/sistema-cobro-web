// EstadoBucket is the shared status-filter vocabulary for both Configuración
// worklists (vendedores: 3 slots; zonas: 4 refs). "todos" means no filter.
export type EstadoBucket = "todos" | "sin-asignar" | "incompletos" | "completos";

// bucketFromFilled classifies a row's mapping progress given how many of its
// slots are filled out of the total — the same rule for vendedores (0-3) and
// zonas (0-4): none assigned, some assigned, or fully assigned.
export function bucketFromFilled(filled: number, total: number): Exclude<EstadoBucket, "todos"> {
  if (filled <= 0) return "sin-asignar";
  if (filled >= total) return "completos";
  return "incompletos";
}
