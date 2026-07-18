// CatalogoRef is a generic (id, nombre) reference into a Microsip catalog
// (caja, cajero, vendedor, cobrador, zona). Used across the zonas-cajas
// slice wherever the backend resolves an id into a display name.
export type CatalogoRef = {
  readonly id: number;
  readonly nombre: string;
};

// SIN_ASIGNAR_ID is the sentinel the backend uses for "this slot is
// unassigned". MSP_CFG_ZONA_CAJA's columns are NOT NULL, so unset is the
// integer -1, never null/undefined, at the wire level (PUT body). The
// domain/GET side still represents "unassigned" as `null` — the sentinel
// only appears at the mapper boundary going out (domainToAsignarZonaCajaBody)
// and in the combobox UI.
export const SIN_ASIGNAR_ID = -1;
