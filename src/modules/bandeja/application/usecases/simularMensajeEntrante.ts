import type { BandejaPort } from "../ports/BandejaPort";
import type { DecisionResult } from "../../domain/entities";

// simularMensajeEntrante delegates directly to the port.
export async function simularMensajeEntrante(
  port: BandejaPort,
  clienteId: number,
  mensaje: string,
): Promise<DecisionResult> {
  return port.simularEntrante(clienteId, mensaje);
}
