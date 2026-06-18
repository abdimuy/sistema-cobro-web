import type { ClientesPort, FichaDateRange } from "../ports/ClientesPort";
import type { RitmoPago } from "../../domain/entities";
import { DomainError } from "../../domain/errors";

export async function obtenerRitmoPago(
  port: ClientesPort,
  clienteId: number,
  range?: FichaDateRange,
  signal?: AbortSignal,
): Promise<RitmoPago> {
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    throw new DomainError(
      "cliente_id_invalido",
      "clienteId debe ser un entero positivo",
    );
  }
  return port.obtenerRitmoPago(clienteId, range, signal);
}
