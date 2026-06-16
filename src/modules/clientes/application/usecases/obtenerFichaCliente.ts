import type { ClientesPort } from "../ports/ClientesPort";
import type { FichaCliente } from "../../domain/entities";
import { DomainError } from "../../domain/errors";

export async function obtenerFichaCliente(
  port: ClientesPort,
  clienteId: number,
  signal?: AbortSignal,
): Promise<FichaCliente> {
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    throw new DomainError(
      "cliente_id_invalido",
      "clienteId debe ser un entero positivo",
    );
  }
  return port.obtenerFicha(clienteId, signal);
}
