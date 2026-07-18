// VendedorSlotDTO matches one of the mapping.v1/v2/v3 slots in the backend
// response shape. snake_case to match backend JSON.
export type VendedorSlotDTO = {
  lista_id: number;
  nombre: string;
};

export type VendedorAsignacionDTO = {
  usuario_id: string;
  nombre: string;
  email: string;
  mapping: {
    v1: VendedorSlotDTO | null;
    v2: VendedorSlotDTO | null;
    v3: VendedorSlotDTO | null;
  };
  estado: string;
};

// VendedoresListResponseDTO matches GET /v2/config/vendedores.
export type VendedoresListResponseDTO = {
  items: VendedorAsignacionDTO[];
};

// IdentidadMicrosipDTO matches GET /v2/config/vendedores/opciones. Each item
// is a Microsip vendor identity grouped by display name.
export type IdentidadMicrosipDTO = {
  nombre: string;
  v1_lista_id: number | null;
  v2_lista_id: number | null;
  v3_lista_id: number | null;
  match_count: number;
};

export type OpcionesVendedorResponseDTO = {
  items: IdentidadMicrosipDTO[];
};

// AsignarVendedorBodyDTO is the PUT /v2/config/vendedores/{usuarioId} body.
// Each field is optional at the wire level too — omit to leave a slot
// unchanged; send null to explicitly clear it.
export type AsignarVendedorBodyDTO = {
  vendedor_lista_id_1?: number | null;
  vendedor_lista_id_2?: number | null;
  vendedor_lista_id_3?: number | null;
};

export type AsignarVendedorResponseDTO = {
  item: VendedorAsignacionDTO;
};
