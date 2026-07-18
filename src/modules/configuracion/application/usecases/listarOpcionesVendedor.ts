import type { ConfiguracionPort } from "../ports/ConfiguracionPort";
import type { IdentidadMicrosip } from "../../domain/entities";

// listarOpcionesVendedor delegates directly to the port. The identities
// list is small and fetched once — no pagination.
export async function listarOpcionesVendedor(
  port: ConfiguracionPort,
  signal?: AbortSignal,
): Promise<IdentidadMicrosip[]> {
  return port.listarOpciones(signal);
}
