// VendedorSlot is one of the three Microsip credit-vendor attribute slots
// (VENDEDOR_1/2/3 in LIBRES_CARGOS_CC) resolved to a display name.
export type VendedorSlot = {
  readonly listaId: number;
  readonly nombre: string;
};

export type VendedorMapping = {
  readonly v1: VendedorSlot | null;
  readonly v2: VendedorSlot | null;
  readonly v3: VendedorSlot | null;
};

// VendedorAsignacion represents one app user's Microsip credit-vendor
// mapping. `estado` is a backend-computed summary string:
// "sin asignar" | "1/3" | "2/3" | "3/3".
export type VendedorAsignacion = {
  readonly usuarioId: string;
  readonly nombre: string;
  readonly email: string;
  readonly mapping: VendedorMapping;
  readonly estado: string;
};
