import type { ClientesPort } from "../ports/ClientesPort";
import type { EventoTimeline } from "../../domain/entities/Timeline";
import { DomainError } from "../../domain/errors";

export async function obtenerTimeline(
  port: ClientesPort,
  clienteId: number,
  signal?: AbortSignal,
): Promise<EventoTimeline[]> {
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    throw new DomainError(
      "cliente_id_invalido",
      "clienteId debe ser un entero positivo",
    );
  }
  return port.obtenerTimeline(clienteId, signal);
}
