import type { BandejaPort, ListarColaParams } from "../ports/BandejaPort";
import type { ConversacionResumen } from "../../domain/entities";

// listarCola delegates directly to the port. Thin on purpose — no client-side
// filtering, the backend already applies estado/soloEscaladas and orders the
// queue so escalated rows come first.
export async function listarCola(
  port: BandejaPort,
  params?: ListarColaParams,
  signal?: AbortSignal,
): Promise<ConversacionResumen[]> {
  return port.listarCola(params, signal);
}
