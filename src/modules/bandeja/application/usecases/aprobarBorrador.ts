import type { BandejaPort } from "../ports/BandejaPort";

// aprobarBorrador delegates directly to the port.
export async function aprobarBorrador(port: BandejaPort, clienteId: number): Promise<void> {
  return port.aprobar(clienteId);
}
