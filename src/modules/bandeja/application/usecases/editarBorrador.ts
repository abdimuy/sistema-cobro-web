import type { BandejaPort } from "../ports/BandejaPort";

// editarBorrador delegates directly to the port.
export async function editarBorrador(
  port: BandejaPort,
  clienteId: number,
  texto: string,
): Promise<void> {
  return port.editar(clienteId, texto);
}
