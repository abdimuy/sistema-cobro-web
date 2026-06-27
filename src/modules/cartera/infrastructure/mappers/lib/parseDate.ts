import { DomainError } from "../../../domain/errors";

export function parseDate(raw: string, field: string): Date | null {
  if (raw === "") return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new DomainError(`${field}_invalida`, `${field} no es un timestamp válido`);
  }
  return d;
}
