import type { FailedIntentRepoPort } from "../ports/FailedIntentRepoPort";
import type { ListInput, ListOutput } from "../dto";
import { DomainError } from "../../domain/errors";

// MAX_PAGE_SIZE mirrors the backend clamp (handlers_test.go locks page_size>100
// down to 100). Asking for more is a UI bug; we refuse to round-trip it.
const MAX_PAGE_SIZE = 100;

export async function listarIntents(
  port: FailedIntentRepoPort,
  input: ListInput,
  signal?: AbortSignal,
): Promise<ListOutput> {
  if (input.pageSize !== undefined) {
    if (!Number.isInteger(input.pageSize) || input.pageSize <= 0) {
      throw new DomainError(
        "page_size_invalido",
        "page_size debe ser un entero positivo",
      );
    }
    if (input.pageSize > MAX_PAGE_SIZE) {
      throw new DomainError(
        "page_size_excedido",
        `page_size no puede exceder ${MAX_PAGE_SIZE}`,
      );
    }
  }
  return port.list(input, signal);
}
