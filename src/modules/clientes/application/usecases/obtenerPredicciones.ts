import type { ClientesPort } from "../ports/ClientesPort";
import type { Predicciones } from "../../domain/entities";
import { DomainError } from "../../domain/errors";

export async function obtenerPredicciones(
  port: ClientesPort,
  clienteId: number,
  signal?: AbortSignal,
): Promise<Predicciones> {
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    throw new DomainError(
      "cliente_id_invalido",
      "clienteId debe ser un entero positivo",
    );
  }
  return port.obtenerPredicciones(clienteId, signal);
}
