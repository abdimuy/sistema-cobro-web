import type { WinbackAnalyticsPort } from "../ports/WinbackAnalyticsPort";
import type { ListarWinbackInput, ListarWinbackOutput } from "../dto";
import { DomainError } from "../../domain/errors";

// MAX_LIMIT mirrors the backend clamp. Asking for more is a UI bug;
// we refuse to round-trip it.
const MAX_LIMIT = 100;

export async function listarWinback(
  port: WinbackAnalyticsPort,
  input: ListarWinbackInput,
  signal?: AbortSignal,
): Promise<ListarWinbackOutput> {
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
  return port.listarItems(input, signal);
}
