import type { ClientesPort } from "../ports/ClientesPort";
import type { ListarVentasInput, ListarVentasOutput } from "../dto";
import { DomainError } from "../../domain/errors";

// MAX_LIMIT mirrors the backend clamp. Asking for more is a UI bug;
// we refuse to round-trip it.
const MAX_LIMIT = 200;

export async function listarVentasCliente(
  port: ClientesPort,
  input: ListarVentasInput,
  signal?: AbortSignal,
): Promise<ListarVentasOutput> {
  if (!Number.isInteger(input.clienteId) || input.clienteId <= 0) {
    throw new DomainError(
      "cliente_id_invalido",
      "clienteId debe ser un entero positivo",
    );
  }
  if (input.limit !== undefined) {
    if (!Number.isInteger(input.limit) || input.limit <= 0) {
      throw new DomainError(
        "limit_invalido",
        "limit debe ser un entero positivo",
      );
    }
    if (input.limit > MAX_LIMIT) {
      throw new DomainError(
        "limit_excedido",
        `limit no puede exceder ${MAX_LIMIT}`,
      );
    }
  }
  return port.listarVentas(input, signal);
}
