import type { ConfiguracionPort } from "../ports/ConfiguracionPort";
import type { VendedorAsignacion } from "../../domain/entities";

// listarVendedores delegates directly to the port. Thin on purpose — no
// filtering, no pagination; the backend returns every user's mapping.
export async function listarVendedores(
  port: ConfiguracionPort,
  signal?: AbortSignal,
): Promise<VendedorAsignacion[]> {
  return port.listarVendedores(signal);
}
