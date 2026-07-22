import type { BandejaPort } from "../ports/BandejaPort";

// escalarConversacion delegates directly to the port.
export async function escalarConversacion(
  port: BandejaPort,
  clienteId: number,
  asignadoA: string,
): Promise<void> {
  return port.escalar(clienteId, asignadoA);
}
