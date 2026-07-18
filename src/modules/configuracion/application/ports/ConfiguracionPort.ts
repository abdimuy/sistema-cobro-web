import type {
  IdentidadMicrosip,
  OpcionesZonasCajas,
  VendedorAsignacion,
  ZonaCajaAsignacion,
} from "../../domain/entities";

// AsignarVendedorInput carries the three lista-id slots to write.
// Each is optional — omitted means "leave that slot as-is" at the port
// boundary; the HTTP adapter's mapper decides omit-vs-null semantics
// against the wire body (see domainToAsignarBody.ts).
export type AsignarVendedorInput = {
  usuarioId: string;
  listaId1?: number | null;
  listaId2?: number | null;
  listaId3?: number | null;
};

// AsignarZonaCajaInput carries the 4 catalog-id slots to write for a zone.
// Unlike vendedores, every slot is required at the port boundary too — the
// backend columns are NOT NULL, so "leave unassigned" is expressed with
// the SIN_ASIGNAR_ID (-1) sentinel, never by omitting a field.
export type AsignarZonaCajaInput = {
  zonaClienteId: number;
  cajaId: number;
  cajeroId: number;
  vendedorId: number;
  cobradorId: number;
};

// ConfiguracionPort is the outbound interface the configuracion module
// requires from its host. The HTTP adapter satisfies it for production;
// an in-memory fake satisfies it for tests.
export interface ConfiguracionPort {
  listarVendedores(signal?: AbortSignal): Promise<VendedorAsignacion[]>;
  listarOpciones(signal?: AbortSignal): Promise<IdentidadMicrosip[]>;
  asignarVendedor(
    input: AsignarVendedorInput,
    signal?: AbortSignal,
  ): Promise<VendedorAsignacion>;
  eliminarVendedor(usuarioId: string, signal?: AbortSignal): Promise<void>;

  listarZonasCajas(signal?: AbortSignal): Promise<ZonaCajaAsignacion[]>;
  listarOpcionesZonasCajas(signal?: AbortSignal): Promise<OpcionesZonasCajas>;
  asignarZonaCaja(
    input: AsignarZonaCajaInput,
    signal?: AbortSignal,
  ): Promise<ZonaCajaAsignacion>;
}
