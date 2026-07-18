import type { ConfiguracionPort } from "../ports/ConfiguracionPort";

// eliminarVendedor delegates directly to the port. Clears the mapping —
// the user's estado goes back to "sin asignar".
export async function eliminarVendedor(
  port: ConfiguracionPort,
  usuarioId: string,
  signal?: AbortSignal,
): Promise<void> {
  return port.eliminarVendedor(usuarioId, signal);
}
