import type { BandejaPort } from "../ports/BandejaPort";
import type { ConversacionDetalle } from "../../domain/entities";

// obtenerConversacion delegates directly to the port.
export async function obtenerConversacion(
  port: BandejaPort,
  clienteId: number,
  signal?: AbortSignal,
): Promise<ConversacionDetalle> {
  return port.obtenerConversacion(clienteId, signal);
}
