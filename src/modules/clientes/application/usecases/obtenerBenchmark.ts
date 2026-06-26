import type { ClientesPort } from "../ports/ClientesPort";
import type { Benchmark, CohortBy } from "../../domain/entities/Benchmark";
import { DomainError } from "../../domain/errors";

export async function obtenerBenchmark(
  port: ClientesPort,
  clienteId: number,
  cohortBy: CohortBy,
  signal?: AbortSignal,
): Promise<Benchmark> {
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    throw new DomainError(
      "cliente_id_invalido",
      "clienteId debe ser un entero positivo",
    );
  }
  return port.obtenerBenchmark(clienteId, cohortBy, signal);
}
