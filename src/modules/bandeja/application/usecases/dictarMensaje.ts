import type { BandejaPort } from "../ports/BandejaPort";

// dictarMensaje delegates directly to the port.
export async function dictarMensaje(
  port: BandejaPort,
  clienteId: number,
  intencion: string,
): Promise<{ borrador: string }> {
  return port.dictar(clienteId, intencion);
}
