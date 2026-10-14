import { DomainError } from "../../../domain/errors";

export function toDomainError(e: unknown): DomainError {
  if (e instanceof DomainError) return e;
  if (e instanceof Error) return new DomainError("error_inesperado", e.message);
  return new DomainError("error_inesperado", String(e));
}
