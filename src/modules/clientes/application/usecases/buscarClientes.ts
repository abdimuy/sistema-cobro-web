import type { ClientesPort } from "../ports/ClientesPort";
import type { BuscarClientesInput, BuscarClientesOutput } from "../dto";
import { DomainError } from "../../domain/errors";

// MAX_LIMIT mirrors the backend clamp. Asking for more is a UI bug;
// we refuse to round-trip it.
const MAX_LIMIT = 200;

// ALLOWED_SORT_BY mirrors the backend sort_by enum. Empty/undefined means the
// backend applies its default ordering.
const ALLOWED_SORT_BY = [
  "nombre",
  "saldo",
  "zona",
  "score",
  "segmento",
  "estado_pago",
  "recencia",
] as const;

export async function buscarClientes(
  port: ClientesPort,
  input: BuscarClientesInput,
  signal?: AbortSignal,
): Promise<BuscarClientesOutput> {
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
  if (input.scoreMin !== undefined) {
    if (
      !Number.isInteger(input.scoreMin) ||
      input.scoreMin < 0 ||
      input.scoreMin > 100
    ) {
      throw new DomainError(
        "score_min_invalido",
        "scoreMin debe ser un entero entre 0 y 100",
      );
    }
  }
  if (input.sortBy !== undefined) {
    if (!ALLOWED_SORT_BY.includes(input.sortBy as (typeof ALLOWED_SORT_BY)[number])) {
      throw new DomainError(
        "sort_by_invalido",
        "sortBy no es una columna ordenable válida",
      );
    }
  }
  if (input.sortOrder !== undefined) {
    if (input.sortOrder !== "asc" && input.sortOrder !== "desc") {
      throw new DomainError(
        "sort_order_invalido",
        "sortOrder debe ser asc o desc",
      );
    }
  }
  return port.buscarClientes(input, signal);
}
