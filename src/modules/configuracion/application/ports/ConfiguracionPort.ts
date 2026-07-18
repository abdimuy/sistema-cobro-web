import type { IdentidadMicrosip, VendedorAsignacion } from "../../domain/entities";

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
}
